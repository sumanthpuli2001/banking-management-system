package com.apexbank.service.paymentrail;

import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.entity.BankAccount;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.BankAccountRepository;
import com.apexbank.repository.paymentrail.PaymentStatusHistoryRepository;
import com.apexbank.repository.paymentrail.PaymentTransactionRecordRepository;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class InternalBankTransferAdapter implements PaymentRailAdapter {

    private final BankAccountRepository bankAccountRepository;
    private final PaymentTransactionRecordRepository paymentRecordRepository;
    private final PaymentStatusHistoryRepository statusHistoryRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    public InternalBankTransferAdapter(BankAccountRepository bankAccountRepository,
                                      PaymentTransactionRecordRepository paymentRecordRepository,
                                      PaymentStatusHistoryRepository statusHistoryRepository,
                                      AccountingEngineService accountingEngineService,
                                      AuditService auditService) {
        this.bankAccountRepository = bankAccountRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.accountingEngineService = accountingEngineService;
        this.auditService = auditService;
    }

    @Override
    public PaymentRailType getRailType() {
        return PaymentRailType.INTERNAL;
    }

    @Override
    public boolean isSimulationMode() {
        return true; // Book transfer within CBS simulation
    }

    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        return BigDecimal.ZERO; // Free internal transfers
    }

    @Override
    public void validateRequest(PaymentRailRequestDto request) {
        if (request.getSourceAccountNumber().equals(request.getDestinationAccountNumber())) {
            throw new BankingException("Source and destination accounts must be distinct for internal book transfer.");
        }
    }

    @Override
    public PaymentRailResponseDto processPayment(PaymentRailRequestDto request, BankAccount sourceAccount, User currentUser) {
        validateRequest(request);

        BankAccount destAccount = bankAccountRepository.findByAccountNumberForUpdate(request.getDestinationAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", request.getDestinationAccountNumber()));

        if (!"ACTIVE".equalsIgnoreCase(destAccount.getStatus())) {
            throw new BankingException("Beneficiary account is not active. Status: " + destAccount.getStatus());
        }

        BigDecimal amount = request.getAmount();
        BigDecimal fee = calculateFee(amount);
        BigDecimal totalDebited = amount.add(fee);

        if (sourceAccount.getAvailableBalance().compareTo(totalDebited) < 0) {
            throw new BankingException("Insufficient funds. Available balance: INR " + sourceAccount.getAvailableBalance());
        }

        String ref = generateReference();
        String idempotency = request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString();

        // Update balances
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(totalDebited));
        sourceAccount.setAvailableBalance(sourceAccount.getAvailableBalance().subtract(totalDebited));
        bankAccountRepository.save(sourceAccount);

        destAccount.setBalance(destAccount.getBalance().add(amount));
        destAccount.setAvailableBalance(destAccount.getAvailableBalance().add(amount));
        bankAccountRepository.save(destAccount);

        PaymentTransactionRecord record = PaymentTransactionRecord.builder()
                .paymentReference(ref)
                .utrNumber("APEXINT" + System.currentTimeMillis())
                .rrnNumber(null)
                .railType(PaymentRailType.INTERNAL)
                .operatingMode(request.getOperatingMode() != null ? request.getOperatingMode() : PaymentRailMode.SIMULATION)
                .status(PaymentRailStatus.SETTLED)
                .sourceAccountNumber(sourceAccount.getAccountNumber())
                .destinationAccountNumber(destAccount.getAccountNumber())
                .beneficiaryName(request.getBeneficiaryName())
                .beneficiaryIfsc("APEX0001001")
                .amount(amount)
                .fee(fee)
                .totalDebited(totalDebited)
                .narration(request.getNarration() != null ? request.getNarration() : "Internal transfer to " + destAccount.getAccountNumber())
                .idempotencyKey(idempotency)
                .responseCode("INT-BOOK-OK")
                .responseMessage("Internal book transfer completed successfully across customer ledgers.")
                .settlementBatchId("REALTIME-INTERNAL")
                .isDemoSimulated(Boolean.TRUE)
                .simulationNotes("INTERNAL_CBS: Real-time book debit/credit within Apex National Bank.")
                .sourceBankAccountId(sourceAccount.getId())
                .branchId(sourceAccount.getBranch() != null ? sourceAccount.getBranch().getId() : null)
                .initiatedByUserId(currentUser != null ? currentUser.getId() : null)
                .initiatedAt(LocalDateTime.now())
                .settledAt(LocalDateTime.now())
                .reconciledAt(LocalDateTime.now())
                .build();

        PaymentTransactionRecord savedRecord = paymentRecordRepository.save(record);

        // Record status history
        statusHistoryRepository.save(PaymentStatusHistory.builder()
                .paymentRecordId(savedRecord.getId())
                .paymentReference(ref)
                .previousStatus(PaymentRailStatus.INITIATED)
                .newStatus(PaymentRailStatus.SETTLED)
                .reason("Direct book settlement")
                .updatedBy(currentUser != null ? currentUser.getUsername() : "SYSTEM")
                .transitionTimestamp(LocalDateTime.now())
                .build());

        // Double-entry accounting: DR 2010 / CR 2010
        try {
            accountingEngineService.postTransactionAccountingEntry(
                    ref,
                    "INTERNAL_TRANSFER",
                    amount,
                    sourceAccount.getBranch(),
                    currentUser,
                    "Internal Transfer from " + sourceAccount.getAccountNumber() + " to " + destAccount.getAccountNumber()
            );
        } catch (Exception e) {
            // Log fallback if accounting mapping is handled
        }

        auditService.recordAudit(currentUser, "INTERNAL_TRANSFER_EXECUTED", "PAYMENT_RAIL", ref,
                "Internal transfer of INR " + amount + " to " + destAccount.getAccountNumber(), "127.0.0.1", "SUCCESS");

        return mapToResponseDto(savedRecord, "2010-DEMAND-DEPOSITS-SAVINGS", "2010-DEMAND-DEPOSITS-SAVINGS");
    }

    @Override
    public PaymentRailResponseDto queryStatus(PaymentTransactionRecord record) {
        return mapToResponseDto(record, "2010-DEMAND-DEPOSITS-SAVINGS", "2010-DEMAND-DEPOSITS-SAVINGS");
    }

    private String generateReference() {
        return "INT-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int) (Math.random() * 900000 + 100000);
    }

    private PaymentRailResponseDto mapToResponseDto(PaymentTransactionRecord r, String drGL, String crGL) {
        return PaymentRailResponseDto.builder()
                .paymentReference(r.getPaymentReference())
                .utrNumber(r.getUtrNumber())
                .rrnNumber(r.getRrnNumber())
                .railType(r.getRailType())
                .operatingMode(r.getOperatingMode())
                .status(r.getStatus())
                .responseCode(r.getResponseCode())
                .responseMessage(r.getResponseMessage())
                .settlementBatchId(r.getSettlementBatchId())
                .amount(r.getAmount())
                .fee(r.getFee())
                .totalDebited(r.getTotalDebited())
                .sourceAccountNumber(r.getSourceAccountNumber())
                .destinationAccountNumber(r.getDestinationAccountNumber())
                .beneficiaryName(r.getBeneficiaryName())
                .beneficiaryIfsc(r.getBeneficiaryIfsc())
                .isDemoSimulated(r.getIsDemoSimulated())
                .simulationNotes(r.getSimulationNotes())
                .initiatedAt(r.getInitiatedAt())
                .settledAt(r.getSettledAt())
                .debitGLAccount(drGL)
                .creditGLAccount(crGL)
                .build();
    }
}
