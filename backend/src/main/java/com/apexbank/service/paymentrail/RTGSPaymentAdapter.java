package com.apexbank.service.paymentrail;

import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.entity.BankAccount;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.*;
import com.apexbank.exception.BankingException;
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
import java.util.regex.Pattern;

@Component
public class RTGSPaymentAdapter implements PaymentRailAdapter {

    private final BankAccountRepository bankAccountRepository;
    private final PaymentTransactionRecordRepository paymentRecordRepository;
    private final PaymentStatusHistoryRepository statusHistoryRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    public static final BigDecimal RTGS_MIN_AMOUNT = new BigDecimal("200000.00");
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");

    public RTGSPaymentAdapter(BankAccountRepository bankAccountRepository,
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
        return PaymentRailType.RTGS;
    }

    @Override
    public boolean isSimulationMode() {
        return true;
    }

    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("500000.00")) <= 0) {
            return new BigDecimal("25.00");
        } else {
            return new BigDecimal("50.00");
        }
    }

    @Override
    public void validateRequest(PaymentRailRequestDto request) {
        if (request.getAmount() == null || request.getAmount().compareTo(RTGS_MIN_AMOUNT) < 0) {
            throw new BankingException("RTGS minimum transaction threshold is INR 2,00,000.00. For lower transaction values, please route via NEFT or IMPS.");
        }
        if (request.getBeneficiaryIfsc() == null || request.getBeneficiaryIfsc().trim().length() != 11) {
            throw new BankingException("Invalid IFSC code: IFSC must be exactly 11 characters.");
        }
        String cleanIfsc = request.getBeneficiaryIfsc().trim().toUpperCase();
        if (!IFSC_PATTERN.matcher(cleanIfsc).matches()) {
            throw new BankingException("Invalid IFSC format for RTGS destination branch.");
        }
    }

    @Override
    public PaymentRailResponseDto processPayment(PaymentRailRequestDto request, BankAccount sourceAccount, User currentUser) {
        validateRequest(request);

        if (request.getOperatingMode() == PaymentRailMode.INTEGRATION) {
            throw new BankingException("RTGS Integration Mode requires authorized RBI RTGS gateway hardware keys. Currently running in SIMULATION mode.");
        }

        BigDecimal amount = request.getAmount();
        BigDecimal fee = calculateFee(amount);
        BigDecimal totalDebited = amount.add(fee);

        if (sourceAccount.getAvailableBalance().compareTo(totalDebited) < 0) {
            throw new BankingException("Insufficient funds. RTGS Principal ₹" + amount + " + RTGS Fee ₹" + fee + " = ₹" + totalDebited + ". Available: ₹" + sourceAccount.getAvailableBalance());
        }

        String ref = generateReference();
        String utr = generateUtr();
        String idempotency = request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString();

        SimulationOutcome outcome = request.getSimulatedOutcome() != null ? request.getSimulatedOutcome() : SimulationOutcome.SUCCESS;

        PaymentRailStatus initialStatus;
        String responseCode;
        String responseMessage;
        String simNotes;

        switch (outcome) {
            case PENDING_CLEARING:
                initialStatus = PaymentRailStatus.SIMULATED_PENDING;
                responseCode = "RTGS-HOLD-101";
                responseMessage = "High-value gross settlement queued in RBI central settlement queue.";
                simNotes = "DEMO / SIMULATED: Gross settlement pending central bank liquidity window.";
                break;
            case BENEFICIARY_REJECTED:
                initialStatus = PaymentRailStatus.SIMULATED_REJECTED;
                responseCode = "REJ-RTGS-NACK";
                responseMessage = "Counterparty bank rejected gross settlement: Account credit limit exceeded or frozen.";
                simNotes = "DEMO / SIMULATED: Immediate NACK response received from counterparty RTGS gateway.";
                break;
            case NETWORK_TIMEOUT:
                initialStatus = PaymentRailStatus.SIMULATED_TIMEOUT;
                responseCode = "TIM-RTGS-TIMEOUT";
                responseMessage = "Central bank gross settlement response timed out. Flagged for inquiry.";
                simNotes = "DEMO / SIMULATED: Network response timeout exception simulated for high-value clearance.";
                break;
            case SUCCESS:
            default:
                initialStatus = PaymentRailStatus.SETTLED;
                responseCode = "RTGS-SETTLED-00";
                responseMessage = "Real-Time Gross Settlement confirmed across RBI central reserve accounts.";
                simNotes = "DEMO / SIMULATED: Real-Time Gross Settlement simulation executed under simulated RBI RTGS window.";
                break;
        }

        // Deduct balance and post accounting only if transaction is accepted or pending
        if (initialStatus == PaymentRailStatus.SETTLED || initialStatus == PaymentRailStatus.SIMULATED_PENDING) {
            sourceAccount.setBalance(sourceAccount.getBalance().subtract(totalDebited));
            sourceAccount.setAvailableBalance(sourceAccount.getAvailableBalance().subtract(totalDebited));
            bankAccountRepository.save(sourceAccount);

            try {
                accountingEngineService.postPaymentRailEntry(
                        ref,
                        "RTGS",
                        amount,
                        fee,
                        sourceAccount.getBranch(),
                        currentUser,
                        "Outward RTGS Settlement (" + utr + ") to " + request.getBeneficiaryName() + " (" + request.getBeneficiaryIfsc() + ")"
                );
            } catch (Exception e) {
                // Accounting posted or handled
            }
        }

        PaymentTransactionRecord record = PaymentTransactionRecord.builder()
                .paymentReference(ref)
                .utrNumber(utr)
                .rrnNumber(null)
                .railType(PaymentRailType.RTGS)
                .operatingMode(PaymentRailMode.SIMULATION)
                .status(initialStatus)
                .sourceAccountNumber(sourceAccount.getAccountNumber())
                .destinationAccountNumber(request.getDestinationAccountNumber())
                .beneficiaryName(request.getBeneficiaryName())
                .beneficiaryIfsc(request.getBeneficiaryIfsc().toUpperCase().trim())
                .amount(amount)
                .fee(fee)
                .totalDebited(initialStatus == PaymentRailStatus.SIMULATED_REJECTED ? BigDecimal.ZERO : totalDebited)
                .narration(request.getNarration() != null ? request.getNarration() : "Outward RTGS Gross Settlement to " + request.getBeneficiaryName())
                .idempotencyKey(idempotency)
                .responseCode(responseCode)
                .responseMessage(responseMessage)
                .settlementBatchId("GROSS-REALTIME")
                .isDemoSimulated(Boolean.TRUE)
                .simulationNotes(simNotes)
                .sourceBankAccountId(sourceAccount.getId())
                .branchId(sourceAccount.getBranch() != null ? sourceAccount.getBranch().getId() : null)
                .initiatedByUserId(currentUser != null ? currentUser.getId() : null)
                .initiatedAt(LocalDateTime.now())
                .settledAt(initialStatus == PaymentRailStatus.SETTLED ? LocalDateTime.now() : null)
                .build();

        PaymentTransactionRecord savedRecord = paymentRecordRepository.save(record);

        statusHistoryRepository.save(PaymentStatusHistory.builder()
                .paymentRecordId(savedRecord.getId())
                .paymentReference(ref)
                .previousStatus(PaymentRailStatus.INITIATED)
                .newStatus(initialStatus)
                .reason(responseMessage)
                .updatedBy(currentUser != null ? currentUser.getUsername() : "SYSTEM")
                .transitionTimestamp(LocalDateTime.now())
                .build());

        auditService.recordAudit(currentUser, "RTGS_SIMULATED_PAYMENT", "PAYMENT_RAIL", ref,
                "Simulated RTGS payment of INR " + amount + " (UTR: " + utr + ", Status: " + initialStatus + ")",
                "127.0.0.1", initialStatus.name());

        return mapToResponseDto(savedRecord, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    @Override
    public PaymentRailResponseDto queryStatus(PaymentTransactionRecord record) {
        return mapToResponseDto(record, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    private String generateUtr() {
        LocalDate today = LocalDate.now();
        int dayOfYear = today.getDayOfYear();
        int twoDigitYear = today.getYear() % 100;
        long randomSerial = (long) (Math.random() * 900000L + 100000L);
        return String.format("APEXR%02d%03d%06d", twoDigitYear, dayOfYear, randomSerial);
    }

    private String generateReference() {
        return "RTGS-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int) (Math.random() * 900000 + 100000);
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
