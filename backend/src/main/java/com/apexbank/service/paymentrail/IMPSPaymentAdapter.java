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
public class IMPSPaymentAdapter implements PaymentRailAdapter {

    private final BankAccountRepository bankAccountRepository;
    private final PaymentTransactionRecordRepository paymentRecordRepository;
    private final PaymentStatusHistoryRepository statusHistoryRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    public static final BigDecimal IMPS_MAX_AMOUNT = new BigDecimal("500000.00");
    public static final BigDecimal IMPS_FLAT_FEE = new BigDecimal("5.00");
    private static final Pattern IFSC_PATTERN = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");

    public IMPSPaymentAdapter(BankAccountRepository bankAccountRepository,
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
        return PaymentRailType.IMPS;
    }

    @Override
    public boolean isSimulationMode() {
        return true;
    }

    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        return IMPS_FLAT_FEE;
    }

    @Override
    public void validateRequest(PaymentRailRequestDto request) {
        if (request.getAmount() == null || request.getAmount().compareTo(IMPS_MAX_AMOUNT) > 0) {
            throw new BankingException("IMPS per-transaction ceiling is INR 5,00,000.00. For transactions exceeding ₹5 Lakhs, please route via RTGS.");
        }
        if (request.getBeneficiaryIfsc() == null || request.getBeneficiaryIfsc().trim().length() != 11) {
            throw new BankingException("Invalid IFSC code: IFSC must be exactly 11 characters.");
        }
        String cleanIfsc = request.getBeneficiaryIfsc().trim().toUpperCase();
        if (!IFSC_PATTERN.matcher(cleanIfsc).matches()) {
            throw new BankingException("Invalid IFSC format for IMPS beneficiary bank.");
        }
    }

    @Override
    public PaymentRailResponseDto processPayment(PaymentRailRequestDto request, BankAccount sourceAccount, User currentUser) {
        validateRequest(request);

        if (request.getOperatingMode() == PaymentRailMode.INTEGRATION) {
            throw new BankingException("IMPS Integration Mode requires NPCI direct member gateway credentials. Currently running in SIMULATION mode.");
        }

        BigDecimal amount = request.getAmount();
        BigDecimal fee = calculateFee(amount);
        BigDecimal totalDebited = amount.add(fee);

        if (sourceAccount.getAvailableBalance().compareTo(totalDebited) < 0) {
            throw new BankingException("Insufficient funds. IMPS Transfer ₹" + amount + " + IMPS Fee ₹" + fee + " = ₹" + totalDebited + ". Available: ₹" + sourceAccount.getAvailableBalance());
        }

        String ref = generateReference();
        String rrn = generateRrn();
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
                responseCode = "IMPS-91-DEEMED";
                responseMessage = "NPCI Deemed Transaction: Response awaited from beneficiary bank switch.";
                simNotes = "DEMO / SIMULATED: Immediate response pending from counterparty NPCI switch.";
                break;
            case BENEFICIARY_REJECTED:
                initialStatus = PaymentRailStatus.SIMULATED_REJECTED;
                responseCode = "REJ-IMPS-U19";
                responseMessage = "NPCI Immediate Return: Beneficiary account does not exist or branch inactive.";
                simNotes = "DEMO / SIMULATED: Simulated instant return code from beneficiary core switch.";
                break;
            case NETWORK_TIMEOUT:
                initialStatus = PaymentRailStatus.SIMULATED_TIMEOUT;
                responseCode = "TIM-IMPS-TIMEOUT";
                responseMessage = "NPCI Switch network timeout. Funds held for automatic end-of-day reversal inquiry.";
                simNotes = "DEMO / SIMULATED: NPCI switch timeout exception simulated.";
                break;
            case SUCCESS:
            default:
                initialStatus = PaymentRailStatus.SETTLED;
                responseCode = "IMPS-00-SUCCESS";
                responseMessage = "Instant 24x7 payment processed and settled across NPCI switch.";
                simNotes = "DEMO / SIMULATED: NPCI IMPS Switch 24x7 instant settlement simulation.";
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
                        "IMPS",
                        amount,
                        fee,
                        sourceAccount.getBranch(),
                        currentUser,
                        "Outward IMPS Transfer (" + rrn + ") to " + request.getBeneficiaryName() + " (" + request.getBeneficiaryIfsc() + ")"
                );
            } catch (Exception e) {
                // Handled
            }
        }

        PaymentTransactionRecord record = PaymentTransactionRecord.builder()
                .paymentReference(ref)
                .utrNumber(utr)
                .rrnNumber(rrn)
                .railType(PaymentRailType.IMPS)
                .operatingMode(PaymentRailMode.SIMULATION)
                .status(initialStatus)
                .sourceAccountNumber(sourceAccount.getAccountNumber())
                .destinationAccountNumber(request.getDestinationAccountNumber())
                .beneficiaryName(request.getBeneficiaryName())
                .beneficiaryIfsc(request.getBeneficiaryIfsc().toUpperCase().trim())
                .amount(amount)
                .fee(fee)
                .totalDebited(initialStatus == PaymentRailStatus.SIMULATED_REJECTED ? BigDecimal.ZERO : totalDebited)
                .narration(request.getNarration() != null ? request.getNarration() : "Instant IMPS to " + request.getBeneficiaryName())
                .idempotencyKey(idempotency)
                .responseCode(responseCode)
                .responseMessage(responseMessage)
                .settlementBatchId("IMPS-REALTIME-24x7")
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

        auditService.recordAudit(currentUser, "IMPS_SIMULATED_PAYMENT", "PAYMENT_RAIL", ref,
                "Simulated IMPS payment of INR " + amount + " (RRN: " + rrn + ", Status: " + initialStatus + ")",
                "127.0.0.1", initialStatus.name());

        return mapToResponseDto(savedRecord, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    @Override
    public PaymentRailResponseDto queryStatus(PaymentTransactionRecord record) {
        return mapToResponseDto(record, "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE");
    }

    private String generateRrn() {
        LocalDateTime now = LocalDateTime.now();
        int dayOfYear = now.getDayOfYear();
        int hour = now.getHour();
        long random7 = (long) (Math.random() * 9000000L + 1000000L);
        return String.format("%03d%02d%07d", dayOfYear, hour, random7);
    }

    private String generateUtr() {
        LocalDate today = LocalDate.now();
        int dayOfYear = today.getDayOfYear();
        int twoDigitYear = today.getYear() % 100;
        long randomSerial = (long) (Math.random() * 900000000L + 100000000L);
        return String.format("APEXI%02d%03d%09d", twoDigitYear, dayOfYear, randomSerial);
    }

    private String generateReference() {
        return "IMPS-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int) (Math.random() * 900000 + 100000);
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
