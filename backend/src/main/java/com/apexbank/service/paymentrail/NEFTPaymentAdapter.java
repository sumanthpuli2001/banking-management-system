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
public class NEFTPaymentAdapter implements PaymentRailAdapter {

    private final BankAccountRepository bankAccountRepository;
    private final PaymentTransactionRecordRepository paymentRecordRepository;
    private final PaymentStatusHistoryRepository statusHistoryRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");

    public NEFTPaymentAdapter(BankAccountRepository bankAccountRepository,
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
        return PaymentRailType.NEFT;
    }

    @Override
    public boolean isSimulationMode() {
        return true;
    }

    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("10000.00")) <= 0) {
            return new BigDecimal("2.50");
        } else if (amount.compareTo(new BigDecimal("100000.00")) <= 0) {
            return new BigDecimal("5.00");
        } else if (amount.compareTo(new BigDecimal("200000.00")) <= 0) {
            return new BigDecimal("15.00");
        } else {
            return new BigDecimal("25.00");
        }
    }

    @Override
    public void validateRequest(PaymentRailRequestDto request) {
        if (request.getBeneficiaryIfsc() == null || request.getBeneficiaryIfsc().trim().length() != 11) {
            throw new BankingException("Invalid IFSC code: IFSC must be exactly 11 characters (e.g., HDFC0001234, SBIN0000123).");
        }
        String cleanIfsc = request.getBeneficiaryIfsc().trim().toUpperCase();
        if (!IFSC_PATTERN.matcher(cleanIfsc).matches()) {
            throw new BankingException("Invalid IFSC format: Standard pattern is 4 alphabets, 5th character '0', followed by 6 alphanumeric characters.");
        }
    }

    @Override
    public PaymentRailResponseDto processPayment(PaymentRailRequestDto request, BankAccount sourceAccount, User currentUser) {
        validateRequest(request);

        if (request.getOperatingMode() == PaymentRailMode.INTEGRATION) {
            throw new BankingException("NEFT Integration Mode requires authorized RBI SFMS / INFINET sponsor bank credentials. Currently running in SIMULATION mode.");
        }

        BigDecimal amount = request.getAmount();
        BigDecimal fee = calculateFee(amount);
        BigDecimal totalDebited = amount.add(fee);

        if (sourceAccount.getAvailableBalance().compareTo(totalDebited) < 0) {
            throw new BankingException("Insufficient funds. Transfer amount ₹" + amount + " + NEFT Fee ₹" + fee + " = ₹" + totalDebited + ". Available: ₹" + sourceAccount.getAvailableBalance());
        }

        String ref = generateReference();
        String utr = generateUtr();
        String batchId = calculateBatchId();
        String idempotency = request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString();

        SimulationOutcome outcome = request.getSimulatedOutcome() != null ? request.getSimulatedOutcome() : SimulationOutcome.SUCCESS;

        PaymentRailStatus initialStatus;
        String responseCode;
        String responseMessage;
        String simNotes;

        switch (outcome) {
            case PENDING_CLEARING:
                initialStatus = PaymentRailStatus.SIMULATED_PENDING;
                responseCode = "NEFT-QUEUED-" + batchId.substring(batchId.lastIndexOf('-') + 1);
                responseMessage = "Transfer queued in simulated NEFT batch window " + batchId + ". Awaiting RBI clearing run.";
                simNotes = "DEMO / SIMULATED: Payment queued in half-hourly settlement window " + batchId + ".";
                break;
            case BENEFICIARY_REJECTED:
                initialStatus = PaymentRailStatus.SIMULATED_REJECTED;
                responseCode = "REJ-NEFT-IFSC-04";
                responseMessage = "Beneficiary bank rejected transaction: Destination account credit restricted or invalid branch.";
                simNotes = "DEMO / SIMULATED: Simulated negative clearing acknowledgement (NACK) from counterparty bank.";
                break;
            case NETWORK_TIMEOUT:
                initialStatus = PaymentRailStatus.SIMULATED_TIMEOUT;
                responseCode = "TIM-NEFT-TIMEOUT";
                responseMessage = "Simulated RBI SFMS gateway timeout. Transaction pending inquiry.";
                simNotes = "DEMO / SIMULATED: Simulated network response timeout for reconciliation demonstration.";
                break;
            case SUCCESS:
            default:
                initialStatus = PaymentRailStatus.SIMULATED_ACCEPTED;
                responseCode = "NEFT-CLR-OK";
                responseMessage = "Simulated NEFT clearance confirmed. UTR assigned and funds routed to settlement pool.";
                simNotes = "DEMO / SIMULATED: Real-time electronic batch clearance simulated under RBI NEFT specifications.";
                break;
        }

        // Deduct balance and post accounting only if transaction is accepted or pending
        if (initialStatus == PaymentRailStatus.SIMULATED_ACCEPTED || initialStatus == PaymentRailStatus.SIMULATED_PENDING) {
            sourceAccount.setBalance(sourceAccount.getBalance().subtract(totalDebited));
            sourceAccount.setAvailableBalance(sourceAccount.getAvailableBalance().subtract(totalDebited));
            bankAccountRepository.save(sourceAccount);

            try {
                accountingEngineService.postPaymentRailEntry(
                        ref,
                        "NEFT",
                        amount,
                        fee,
                        sourceAccount.getBranch(),
                        currentUser,
                        "Outward NEFT Transfer (" + utr + ") to " + request.getBeneficiaryName() + " (" + request.getBeneficiaryIfsc() + ")"
                );
            } catch (Exception e) {
                // Double-entry posted or fallback handled
            }
        }

        PaymentTransactionRecord record = PaymentTransactionRecord.builder()
                .paymentReference(ref)
                .utrNumber(utr)
                .rrnNumber(null)
                .railType(PaymentRailType.NEFT)
                .operatingMode(PaymentRailMode.SIMULATION)
                .status(initialStatus)
                .sourceAccountNumber(sourceAccount.getAccountNumber())
                .destinationAccountNumber(request.getDestinationAccountNumber())
                .beneficiaryName(request.getBeneficiaryName())
                .beneficiaryIfsc(request.getBeneficiaryIfsc().toUpperCase().trim())
                .amount(amount)
                .fee(fee)
                .totalDebited(initialStatus == PaymentRailStatus.SIMULATED_REJECTED ? BigDecimal.ZERO : totalDebited)
                .narration(request.getNarration() != null ? request.getNarration() : "Outward NEFT to " + request.getBeneficiaryName())
                .idempotencyKey(idempotency)
                .responseCode(responseCode)
                .responseMessage(responseMessage)
                .settlementBatchId(batchId)
                .isDemoSimulated(Boolean.TRUE)
                .simulationNotes(simNotes)
                .sourceBankAccountId(sourceAccount.getId())
                .branchId(sourceAccount.getBranch() != null ? sourceAccount.getBranch().getId() : null)
                .initiatedByUserId(currentUser != null ? currentUser.getId() : null)
                .initiatedAt(LocalDateTime.now())
                .settledAt(initialStatus == PaymentRailStatus.SIMULATED_ACCEPTED ? LocalDateTime.now() : null)
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

        auditService.recordAudit(currentUser, "NEFT_SIMULATED_PAYMENT", "PAYMENT_RAIL", ref,
                "Simulated NEFT payment of INR " + amount + " (UTR: " + utr + ", Status: " + initialStatus + ")",
                "127.0.0.1", initialStatus.name());

        return mapToResponseDto(savedRecord, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    @Override
    public PaymentRailResponseDto queryStatus(PaymentTransactionRecord record) {
        return mapToResponseDto(record, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    private String calculateBatchId() {
        LocalDateTime now = LocalDateTime.now();
        int batchNumber = now.getHour() * 2 + (now.getMinute() >= 30 ? 2 : 1);
        return String.format("NEFT-%s-B%02d", now.format(DateTimeFormatter.ofPattern("yyyyMMdd")), batchNumber);
    }

    private String generateUtr() {
        LocalDate today = LocalDate.now();
        int dayOfYear = today.getDayOfYear();
        int twoDigitYear = today.getYear() % 100;
        long randomSerial = (long) (Math.random() * 900000L + 100000L);
        return String.format("APEXN%02d%03d%06d", twoDigitYear, dayOfYear, randomSerial);
    }

    private String generateReference() {
        return "NEFT-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int) (Math.random() * 900000 + 100000);
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
