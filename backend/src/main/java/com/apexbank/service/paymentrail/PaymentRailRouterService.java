package com.apexbank.service.paymentrail;

import com.apexbank.dto.paymentrail.PaymentRailConfigDto;
import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.dto.paymentrail.SimulationReconcileRequestDto;
import com.apexbank.entity.BankAccount;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.BankAccountRepository;
import com.apexbank.repository.paymentrail.PaymentStatusHistoryRepository;
import com.apexbank.repository.paymentrail.PaymentTransactionRecordRepository;
import com.apexbank.service.AuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PaymentRailRouterService {

    private final Map<PaymentRailType, PaymentRailAdapter> adapterRegistry = new EnumMap<>(PaymentRailType.class);
    private final BankAccountRepository bankAccountRepository;
    private final PaymentTransactionRecordRepository paymentRecordRepository;
    private final PaymentStatusHistoryRepository statusHistoryRepository;
    private final AuditService auditService;

    public PaymentRailRouterService(List<PaymentRailAdapter> adapters,
                                    BankAccountRepository bankAccountRepository,
                                    PaymentTransactionRecordRepository paymentRecordRepository,
                                    PaymentStatusHistoryRepository statusHistoryRepository,
                                    AuditService auditService) {
        for (PaymentRailAdapter adapter : adapters) {
            this.adapterRegistry.put(adapter.getRailType(), adapter);
        }
        this.bankAccountRepository = bankAccountRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.auditService = auditService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaymentRailResponseDto processPayment(PaymentRailRequestDto request, User currentUser) {
        if (request.getRailType() == null) {
            throw new BankingException("Payment rail type must be specified (INTERNAL, NEFT, RTGS, IMPS).");
        }

        // Idempotency validation
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            Optional<PaymentTransactionRecord> existing = paymentRecordRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                PaymentRailAdapter adapter = getAdapter(existing.get().getRailType());
                return adapter.queryStatus(existing.get());
            }
        }

        PaymentRailAdapter adapter = getAdapter(request.getRailType());

        // Validate source account
        BankAccount sourceAccount = bankAccountRepository.findByAccountNumberForUpdate(request.getSourceAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", request.getSourceAccountNumber()));

        if (!"ACTIVE".equalsIgnoreCase(sourceAccount.getStatus())) {
            throw new BankingException("Source funding account is not ACTIVE. Current status: " + sourceAccount.getStatus());
        }

        return adapter.processPayment(request, sourceAccount, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<PaymentRailResponseDto> getRecentTransactions(PaymentRailType railType, PaymentRailStatus status, Pageable pageable) {
        Page<PaymentTransactionRecord> records = paymentRecordRepository.findFiltered(railType, status, pageable);
        return records.map(this::mapRecordToDto);
    }

    @Transactional(readOnly = true)
    public PaymentRailResponseDto getTransactionByReference(String reference) {
        PaymentTransactionRecord record = paymentRecordRepository.findByPaymentReference(reference)
                .or(() -> paymentRecordRepository.findByUtrNumber(reference))
                .or(() -> paymentRecordRepository.findByRrnNumber(reference))
                .orElseThrow(() -> new ResourceNotFoundException("PaymentTransactionRecord", "reference/UTR/RRN", reference));

        return mapRecordToDto(record);
    }

    @Transactional(readOnly = true)
    public List<PaymentRailConfigDto> getRailConfigurations() {
        return List.of(
                PaymentRailConfigDto.builder()
                        .railType(PaymentRailType.INTERNAL)
                        .name("Apex Internal Transfer")
                        .description("Real-time intra-bank book transfer between accounts within Apex National Bank.")
                        .minAmount(new BigDecimal("1.00"))
                        .maxAmount(new BigDecimal("10000000.00"))
                        .flatFee(BigDecimal.ZERO)
                        .operatingMode(PaymentRailMode.SIMULATION)
                        .batchCycle("Instant Continuous Settlement (Book Transfer)")
                        .isAvailable(true)
                        .warningNotice("DEMO / SIMULATED: Executes immediate book transfer between internal core customer accounts.")
                        .build(),
                PaymentRailConfigDto.builder()
                        .railType(PaymentRailType.NEFT)
                        .name("National Electronic Funds Transfer (NEFT)")
                        .description("RBI half-hourly electronic clearing batch network for standard interbank fund transfers.")
                        .minAmount(new BigDecimal("1.00"))
                        .maxAmount(new BigDecimal("5000000.00"))
                        .flatFee(new BigDecimal("5.00"))
                        .operatingMode(PaymentRailMode.SIMULATION)
                        .batchCycle("Half-Hourly Batches (48 Cycles / Day)")
                        .isAvailable(true)
                        .warningNotice("DEMO / SIMULATED: Generates authentic 16-character RBI UTR numbers and simulates batch clearing cycles.")
                        .build(),
                PaymentRailConfigDto.builder()
                        .railType(PaymentRailType.RTGS)
                        .name("Real-Time Gross Settlement (RTGS)")
                        .description("High-value continuous gross settlement for urgent payments exceeding INR 2 Lakhs.")
                        .minAmount(new BigDecimal("200000.00"))
                        .maxAmount(new BigDecimal("100000000.00"))
                        .flatFee(new BigDecimal("25.00"))
                        .operatingMode(PaymentRailMode.SIMULATION)
                        .batchCycle("Real-Time Continuous Gross Settlement (RBI Switch)")
                        .isAvailable(true)
                        .warningNotice("DEMO / SIMULATED: Mandatory minimum of ₹2,00,000 enforced. Real-time gross settlement simulated.")
                        .build(),
                PaymentRailConfigDto.builder()
                        .railType(PaymentRailType.IMPS)
                        .name("Immediate Payment Service (IMPS)")
                        .description("NPCI 24x7x365 instant interbank retail payment service up to INR 5 Lakhs.")
                        .minAmount(new BigDecimal("1.00"))
                        .maxAmount(new BigDecimal("500000.00"))
                        .flatFee(new BigDecimal("5.00"))
                        .operatingMode(PaymentRailMode.SIMULATION)
                        .batchCycle("24x7x365 Immediate Switch (NPCI Rail)")
                        .isAvailable(true)
                        .warningNotice("DEMO / SIMULATED: Maximum ceiling of ₹5,00,000 enforced. 12-digit RRN generated.")
                        .build()
        );
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaymentRailResponseDto reconcilePendingSimulatedTransaction(String reference,
                                                                      SimulationReconcileRequestDto request,
                                                                      User currentUser) {
        PaymentTransactionRecord record = paymentRecordRepository.findByPaymentReference(reference)
                .or(() -> paymentRecordRepository.findByUtrNumber(reference))
                .orElseThrow(() -> new ResourceNotFoundException("PaymentTransactionRecord", "reference/UTR", reference));

        PaymentRailStatus oldStatus = record.getStatus();
        PaymentRailStatus targetStatus = request.getTargetStatus();

        if (oldStatus == targetStatus) {
            return mapRecordToDto(record);
        }

        // Handle refund if moving from PENDING/TIMEOUT to FAILED/REJECTED
        if ((oldStatus == PaymentRailStatus.SIMULATED_PENDING || oldStatus == PaymentRailStatus.SIMULATED_TIMEOUT) &&
                (targetStatus == PaymentRailStatus.FAILED || targetStatus == PaymentRailStatus.SIMULATED_REJECTED)) {

            // Refund customer account
            bankAccountRepository.findByAccountNumberForUpdate(record.getSourceAccountNumber())
                    .ifPresent(account -> {
                        account.setBalance(account.getBalance().add(record.getTotalDebited()));
                        account.setAvailableBalance(account.getAvailableBalance().add(record.getTotalDebited()));
                        bankAccountRepository.save(account);
                    });
            record.setResponseMessage("Simulated payment failed reconciliation: Funds refunded to source account.");
        } else if (targetStatus == PaymentRailStatus.SETTLED || targetStatus == PaymentRailStatus.RECONCILED) {
            record.setSettledAt(LocalDateTime.now());
            record.setReconciledAt(LocalDateTime.now());
            record.setResponseMessage("Simulated clearing reconciliation confirmed: Payment settled across counterparty rail.");
        }

        record.setStatus(targetStatus);
        PaymentTransactionRecord saved = paymentRecordRepository.save(record);

        statusHistoryRepository.save(PaymentStatusHistory.builder()
                .paymentRecordId(saved.getId())
                .paymentReference(record.getPaymentReference())
                .previousStatus(oldStatus)
                .newStatus(targetStatus)
                .reason(request.getReconciliationRemarks() != null ? request.getReconciliationRemarks() : "Manual simulated clearing reconciliation")
                .updatedBy(currentUser != null ? currentUser.getUsername() : "SYSTEM")
                .transitionTimestamp(LocalDateTime.now())
                .build());

        auditService.recordAudit(currentUser, "PAYMENT_RECONCILED", "PAYMENT_RAIL", record.getPaymentReference(),
                "Reconciled payment from " + oldStatus + " to " + targetStatus, "127.0.0.1", "SUCCESS");

        return mapRecordToDto(saved);
    }

    private PaymentRailAdapter getAdapter(PaymentRailType type) {
        PaymentRailAdapter adapter = adapterRegistry.get(type);
        if (adapter == null) {
            throw new BankingException("Unsupported payment rail: " + type);
        }
        return adapter;
    }

    private PaymentRailResponseDto mapRecordToDto(PaymentTransactionRecord r) {
        String drGL = "2010-DEMAND-DEPOSITS-SAVINGS";
        String crGL = r.getRailType() == PaymentRailType.INTERNAL ? "2010-DEMAND-DEPOSITS-SAVINGS" : "1040-RBI-RESERVE-BALANCE";

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
