package com.apexbank.service.compliance;

import com.apexbank.dto.compliance.AmlAlertDto;
import com.apexbank.dto.compliance.AmlCaseActionRequest;
import com.apexbank.dto.compliance.AmlCaseNoteDto;
import com.apexbank.dto.compliance.AmlRuleConfigDto;
import com.apexbank.dto.compliance.ComplianceDashboardSummaryDto;
import com.apexbank.entity.*;
import com.apexbank.entity.compliance.AmlAlert;
import com.apexbank.entity.compliance.AmlCaseNote;
import com.apexbank.entity.compliance.AmlRuleConfig;
import com.apexbank.repository.CustomerRepository;
import com.apexbank.repository.TransactionRepository;
import com.apexbank.repository.compliance.AmlAlertRepository;
import com.apexbank.repository.compliance.AmlCaseNoteRepository;
import com.apexbank.repository.compliance.AmlRuleConfigRepository;
import com.apexbank.repository.compliance.CustomerKycProfileRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmlMonitoringEngineService {

    private final AmlAlertRepository amlAlertRepository;
    private final AmlCaseNoteRepository amlCaseNoteRepository;
    private final AmlRuleConfigRepository amlRuleConfigRepository;
    private final CustomerKycProfileRepository customerKycProfileRepository;
    private final TransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;

    @PostConstruct
    @Transactional
    public void initDefaultAmlRules() {
        if (amlRuleConfigRepository.count() > 0) return;

        log.info("Initializing regulatory AML detection rule repository...");
        List<AmlRuleConfig> defaultRules = List.of(
                AmlRuleConfig.builder()
                        .ruleCode("RULE_LARGE_CASH_CTR")
                        .ruleName("High-Value Cash Transaction (CTR Threshold)")
                        .severity("CRITICAL")
                        .thresholdAmount(new BigDecimal("1000000.00")) // ₹10,00,000
                        .lookbackHours(24)
                        .description("Cash deposits or withdrawals exceeding statutory ₹10,00,000 threshold under PMLA 2002 Section 12.")
                        .isActive(true)
                        .isRegulatoryReportRequired(true)
                        .statutoryReference("PMLA 2002 Sec 12 / FIU-IND CTR Reporting")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build(),

                AmlRuleConfig.builder()
                        .ruleCode("RULE_STRUCTURING_SMURF")
                        .ruleName("Suspected Cash Structuring / Smurfing")
                        .severity("CRITICAL")
                        .thresholdAmount(new BigDecimal("1000000.00"))
                        .lookbackHours(48)
                        .description("Multiple cash transactions in 48-hour rolling window aggregating >= ₹10,00,000 with individual amounts below threshold.")
                        .isActive(true)
                        .isRegulatoryReportRequired(true)
                        .statutoryReference("RBI Master Direction AML/KYC Cl. 5.1(b)")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build(),

                AmlRuleConfig.builder()
                        .ruleCode("RULE_RAPID_MOVEMENT")
                        .ruleName("Rapid Movement of Funds (Pass-Through)")
                        .severity("HIGH")
                        .thresholdAmount(new BigDecimal("300000.00"))
                        .lookbackHours(2)
                        .description("Rapid dissipation of funds: immediate debit of >= 80% of newly credited funds within 2 hours.")
                        .isActive(true)
                        .isRegulatoryReportRequired(false)
                        .statutoryReference("FATF Red Flag Indicator 4.3")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build(),

                AmlRuleConfig.builder()
                        .ruleCode("RULE_DORMANT_ACTIVATION")
                        .ruleName("Sudden Reactivation of Dormant Account")
                        .severity("HIGH")
                        .thresholdAmount(new BigDecimal("500000.00"))
                        .lookbackHours(4320) // 180 days
                        .description("Sudden high-value credit into an account having zero transaction activity for more than 180 days.")
                        .isActive(true)
                        .isRegulatoryReportRequired(false)
                        .statutoryReference("RBI Circular on Inoperative Accounts 2024")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build(),

                AmlRuleConfig.builder()
                        .ruleCode("RULE_INCOME_INCONSISTENCY")
                        .ruleName("Activity Inconsistent with Declared Income Profile")
                        .severity("MEDIUM")
                        .thresholdAmount(new BigDecimal("1500000.00"))
                        .lookbackHours(24)
                        .multiplier(BigDecimal.valueOf(3.0))
                        .description("Transaction single ticket exceeds 3x customer declared annual income profile.")
                        .isActive(true)
                        .isRegulatoryReportRequired(false)
                        .statutoryReference("PMLA Rules 2005 Rule 9(12)")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build(),

                AmlRuleConfig.builder()
                        .ruleCode("RULE_PEP_HIGH_RISK")
                        .ruleName("High-Risk Customer / PEP Activity Threshold")
                        .severity("HIGH")
                        .thresholdAmount(new BigDecimal("500000.00"))
                        .lookbackHours(24)
                        .description("Transactions >= ₹5,00,000 conducted by Politically Exposed Persons (PEPs) or High-Risk classified entities.")
                        .isActive(true)
                        .isRegulatoryReportRequired(false)
                        .statutoryReference("FATF Guidance on PEPs (Recommendation 12)")
                        .updatedByOfficer("SYSTEM")
                        .effectiveFrom(LocalDateTime.now())
                        .build()
        );

        amlRuleConfigRepository.saveAll(defaultRules);
        log.info("Initialized {} default AML regulatory detection rules.", defaultRules.size());
    }

    /**
     * Evaluates a completed/processed transaction against active AML rule criteria.
     * Returns any generated AmlAlerts.
     */
    @Transactional
    public List<AmlAlert> evaluateTransaction(Transaction txn) {
        if (txn == null || txn.getAmount() == null) return Collections.emptyList();

        List<AmlRuleConfig> activeRules = amlRuleConfigRepository.findByIsActiveTrue();
        if (activeRules.isEmpty()) return Collections.emptyList();

        BankAccount account = txn.getSourceAccount() != null ? txn.getSourceAccount() : txn.getDestinationAccount();
        if (account == null || account.getCustomer() == null) return Collections.emptyList();

        Customer customer = account.getCustomer();
        List<AmlAlert> triggeredAlerts = new ArrayList<>();

        for (AmlRuleConfig rule : activeRules) {
            switch (rule.getRuleCode()) {
                case "RULE_LARGE_CASH_CTR":
                    checkLargeCashCtr(txn, customer, account, rule).ifPresent(triggeredAlerts::add);
                    break;
                case "RULE_STRUCTURING_SMURF":
                    checkStructuring(txn, customer, account, rule).ifPresent(triggeredAlerts::add);
                    break;
                case "RULE_INCOME_INCONSISTENCY":
                    checkIncomeInconsistency(txn, customer, account, rule).ifPresent(triggeredAlerts::add);
                    break;
                case "RULE_PEP_HIGH_RISK":
                    checkPepHighRisk(txn, customer, account, rule).ifPresent(triggeredAlerts::add);
                    break;
                case "RULE_DORMANT_ACTIVATION":
                    checkDormantReactivation(txn, customer, account, rule).ifPresent(triggeredAlerts::add);
                    break;
                default:
                    break;
            }
        }

        return triggeredAlerts;
    }

    private Optional<AmlAlert> checkLargeCashCtr(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule) {
        boolean isCash = txn.getTransactionType() == TransactionType.CASH_DEPOSIT ||
                         txn.getTransactionType() == TransactionType.CASH_WITHDRAWAL;
        if (!isCash) return Optional.empty();

        if (txn.getAmount().compareTo(rule.getThresholdAmount()) >= 0) {
            String details = String.format("Single cash transaction of ₹%s exceeds CTR reporting threshold of ₹%s. Statutory CTR filing obligation under PMLA 2002.",
                    txn.getAmount().toPlainString(), rule.getThresholdAmount().toPlainString());
            return Optional.of(createAlert(txn, customer, account, rule, 95, details));
        }
        return Optional.empty();
    }

    private Optional<AmlAlert> checkStructuring(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule) {
        boolean isCash = txn.getTransactionType() == TransactionType.CASH_DEPOSIT ||
                         txn.getTransactionType() == TransactionType.CASH_WITHDRAWAL;
        if (!isCash) return Optional.empty();

        // If single txn is already >= 10L, CTR rule catches it. Structuring is when individual is < 10L but aggregate >= 10L.
        if (txn.getAmount().compareTo(rule.getThresholdAmount()) >= 0) return Optional.empty();

        LocalDateTime since = LocalDateTime.now().minusHours(rule.getLookbackHours());
        List<Transaction> recentCash = transactionRepository.findRecentCashTransactionsByAccount(account.getId(), since);

        BigDecimal aggregateCash = recentCash.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (aggregateCash.compareTo(rule.getThresholdAmount()) >= 0 && recentCash.size() >= 2) {
            String details = String.format("Suspected Structuring: %d cash transactions in %d hours aggregate to ₹%s, breaching threshold of ₹%s while individual amounts were below threshold.",
                    recentCash.size(), rule.getLookbackHours(), aggregateCash.toPlainString(), rule.getThresholdAmount().toPlainString());
            return Optional.of(createAlert(txn, customer, account, rule, 90, details));
        }
        return Optional.empty();
    }

    private Optional<AmlAlert> checkIncomeInconsistency(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule) {
        BigDecimal annualIncome = customer.getAnnualIncome();
        BigDecimal threshold = rule.getThresholdAmount();

        if (annualIncome != null && annualIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal maxAllowed = annualIncome.multiply(rule.getMultiplier());
            if (txn.getAmount().compareTo(maxAllowed) > 0) {
                String details = String.format("Transaction amount ₹%s is %.1fx greater than declared annual income profile of ₹%s.",
                        txn.getAmount().toPlainString(),
                        txn.getAmount().divide(annualIncome, 1, java.math.RoundingMode.HALF_UP).doubleValue(),
                        annualIncome.toPlainString());
                return Optional.of(createAlert(txn, customer, account, rule, 75, details));
            }
        } else if (threshold != null && txn.getAmount().compareTo(threshold) >= 0) {
            String details = String.format("Transaction amount ₹%s exceeds default unprofiled benchmark threshold of ₹%s.",
                    txn.getAmount().toPlainString(), threshold.toPlainString());
            return Optional.of(createAlert(txn, customer, account, rule, 65, details));
        }
        return Optional.empty();
    }

    private Optional<AmlAlert> checkPepHighRisk(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule) {
        boolean isHighRisk = "HIGH".equalsIgnoreCase(customer.getRiskCategory()) ||
                             "PEP".equalsIgnoreCase(customer.getRiskCategory());
        if (!isHighRisk) return Optional.empty();

        if (txn.getAmount().compareTo(rule.getThresholdAmount()) >= 0) {
            String details = String.format("High-Risk / Politically Exposed Person (Category: %s) conducted transaction of ₹%s >= ₹%s monitor limit.",
                    customer.getRiskCategory(), txn.getAmount().toPlainString(), rule.getThresholdAmount().toPlainString());
            return Optional.of(createAlert(txn, customer, account, rule, 85, details));
        }
        return Optional.empty();
    }

    private Optional<AmlAlert> checkDormantReactivation(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule) {
        if (txn.getAmount().compareTo(rule.getThresholdAmount()) < 0) return Optional.empty();

        LocalDateTime cutoff = LocalDateTime.now().minusDays(180);
        long historicalCount = transactionRepository.countHistoricalTransactionsBefore(account.getId(), cutoff);

        // If account had very low activity in past 180 days and receives a spike
        if (historicalCount == 0) {
            String details = String.format("Reactivation spike: Account had zero transactions prior to 180 days, now executing ₹%s.",
                    txn.getAmount().toPlainString());
            return Optional.of(createAlert(txn, customer, account, rule, 80, details));
        }
        return Optional.empty();
    }

    private AmlAlert createAlert(Transaction txn, Customer customer, BankAccount account, AmlRuleConfig rule, int score, String details) {
        String alertNumber = String.format("AML-%s-%04d",
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                ThreadLocalRandom.current().nextInt(1000, 9999));

        AmlAlert alert = AmlAlert.builder()
                .alertNumber(alertNumber)
                .ruleCode(rule.getRuleCode())
                .ruleName(rule.getRuleName())
                .severity(rule.getSeverity())
                .status("NEW_ALERT")
                .customerId(customer.getId())
                .customerNumber(customer.getCustomerNumber())
                .customerName(customer.getFullName())
                .customerRiskCategory(customer.getRiskCategory())
                .accountNumber(account.getAccountNumber())
                .transactionReference(txn.getReferenceNumber())
                .transactionAmount(txn.getAmount())
                .transactionType(txn.getTransactionType() != null ? txn.getTransactionType().name() : "TRANSFER")
                .detectionScore(score)
                .triggerDetails(details)
                .assignedOfficer("UNASSIGNED")
                .detectedTimestamp(LocalDateTime.now())
                .build();

        AmlAlert saved = amlAlertRepository.save(alert);

        // Record initial case note
        AmlCaseNote note = AmlCaseNote.builder()
                .alertId(saved.getId())
                .authorUsername("SYSTEM_AML_ENGINE")
                .actionTaken("ALERT_GENERATED")
                .noteText("Automated rule triggered: " + rule.getRuleName() + ". " + details)
                .isConfidential(false)
                .recordedAt(LocalDateTime.now())
                .build();
        amlCaseNoteRepository.save(note);

        log.warn("🚨 AML Alert Generated: {} | Rule: {} | Customer: {} | Amount: ₹{}",
                alertNumber, rule.getRuleCode(), customer.getCustomerNumber(), txn.getAmount());

        return saved;
    }

    public Page<AmlAlertDto> getAlerts(String status, String severity, String ruleCode, Pageable pageable) {
        Page<AmlAlert> page = amlAlertRepository.findFilteredAlerts(
                (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) ? null : status,
                (severity == null || severity.isBlank() || "ALL".equalsIgnoreCase(severity)) ? null : severity,
                (ruleCode == null || ruleCode.isBlank() || "ALL".equalsIgnoreCase(ruleCode)) ? null : ruleCode,
                pageable
        );

        List<AmlAlertDto> dtos = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public AmlAlertDto getAlertById(Long alertId) {
        AmlAlert alert = amlAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("AML Alert not found with ID: " + alertId));
        return mapToDto(alert);
    }

    @Transactional
    public AmlAlertDto processCaseAction(Long alertId, AmlCaseActionRequest request, String username) {
        AmlAlert alert = amlAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("AML Alert not found with ID: " + alertId));

        String action = request.getAction().toUpperCase();
        String noteText = request.getNote();

        switch (action) {
            case "INVESTIGATE":
                alert.setStatus("UNDER_INVESTIGATION");
                if (request.getAssignedOfficer() != null && !request.getAssignedOfficer().isBlank()) {
                    alert.setAssignedOfficer(request.getAssignedOfficer());
                } else if (username != null) {
                    alert.setAssignedOfficer(username);
                }
                break;

            case "ESCALATE_MLRO":
                alert.setStatus("ESCALATED_TO_MLRO");
                alert.setEscalatedTimestamp(LocalDateTime.now());
                if (username != null) alert.setAssignedOfficer("MLRO_COMPLIANCE_CELL");
                break;

            case "FILE_STR":
                alert.setStatus("STR_FILED");
                String fiuRef = request.getFiuStrReference();
                if (fiuRef == null || fiuRef.isBlank()) {
                    fiuRef = String.format("FIU-IND-STR-%d-%05d",
                            LocalDate.now().getYear(),
                            ThreadLocalRandom.current().nextInt(10000, 99999));
                }
                alert.setFiuStrReference(fiuRef);
                noteText = noteText + " [Statutory STR Filed under PMLA Sec 12 with FIU-IND Reference: " + fiuRef + " (SIMULATED REGULATORY REPORTING)]";
                break;

            case "CLOSE_FALSE_POSITIVE":
                alert.setStatus("CLOSED_FALSE_POSITIVE");
                alert.setClosedTimestamp(LocalDateTime.now());
                alert.setClosureReason("FALSE_POSITIVE: " + noteText);
                break;

            case "CLOSE_EXPLAINED":
                alert.setStatus("CLOSED_EXPLAINED");
                alert.setClosedTimestamp(LocalDateTime.now());
                alert.setClosureReason("EXPLAINED_LEGITIMATE: " + noteText);
                break;

            default:
                throw new IllegalArgumentException("Unsupported AML case action: " + action);
        }

        AmlAlert updated = amlAlertRepository.save(alert);

        // Add case audit note
        AmlCaseNote note = AmlCaseNote.builder()
                .alertId(alertId)
                .authorUsername(username != null ? username : "COMPLIANCE_OFFICER")
                .actionTaken(action)
                .noteText(noteText)
                .isConfidential(action.equals("FILE_STR") || action.equals("ESCALATE_MLRO"))
                .recordedAt(LocalDateTime.now())
                .build();
        amlCaseNoteRepository.save(note);

        return mapToDto(updated);
    }

    @Transactional
    public AmlCaseNoteDto addCaseNote(Long alertId, String noteText, String actionTaken, boolean isConfidential, String username) {
        AmlAlert alert = amlAlertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("AML Alert not found with ID: " + alertId));

        AmlCaseNote note = AmlCaseNote.builder()
                .alertId(alert.getId())
                .authorUsername(username != null ? username : "COMPLIANCE_OFFICER")
                .actionTaken(actionTaken != null ? actionTaken : "INVESTIGATION_NOTE")
                .noteText(noteText)
                .isConfidential(isConfidential)
                .recordedAt(LocalDateTime.now())
                .build();

        AmlCaseNote saved = amlCaseNoteRepository.save(note);
        return mapCaseNoteToDto(saved);
    }

    public List<AmlRuleConfigDto> getRuleConfigs() {
        return amlRuleConfigRepository.findAll().stream()
                .map(r -> AmlRuleConfigDto.builder()
                        .id(r.getId())
                        .ruleCode(r.getRuleCode())
                        .ruleName(r.getRuleName())
                        .severity(r.getSeverity())
                        .thresholdAmount(r.getThresholdAmount())
                        .lookbackHours(r.getLookbackHours())
                        .multiplier(r.getMultiplier())
                        .description(r.getDescription())
                        .isActive(r.getIsActive())
                        .isRegulatoryReportRequired(r.getIsRegulatoryReportRequired())
                        .statutoryReference(r.getStatutoryReference())
                        .updatedByOfficer(r.getUpdatedByOfficer())
                        .effectiveFrom(r.getEffectiveFrom())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public AmlRuleConfigDto updateRuleConfig(String ruleCode, AmlRuleConfigDto updateDto, String username) {
        AmlRuleConfig rule = amlRuleConfigRepository.findByRuleCode(ruleCode)
                .orElseThrow(() -> new IllegalArgumentException("AML Rule not found with code: " + ruleCode));

        if (updateDto.getThresholdAmount() != null) rule.setThresholdAmount(updateDto.getThresholdAmount());
        if (updateDto.getLookbackHours() != null) rule.setLookbackHours(updateDto.getLookbackHours());
        if (updateDto.getMultiplier() != null) rule.setMultiplier(updateDto.getMultiplier());
        if (updateDto.getIsActive() != null) rule.setIsActive(updateDto.getIsActive());
        if (updateDto.getSeverity() != null) rule.setSeverity(updateDto.getSeverity());
        rule.setUpdatedByOfficer(username != null ? username : "SUPER_ADMIN");
        rule.setEffectiveFrom(LocalDateTime.now());

        AmlRuleConfig saved = amlRuleConfigRepository.save(rule);
        return AmlRuleConfigDto.builder()
                .id(saved.getId())
                .ruleCode(saved.getRuleCode())
                .ruleName(saved.getRuleName())
                .severity(saved.getSeverity())
                .thresholdAmount(saved.getThresholdAmount())
                .lookbackHours(saved.getLookbackHours())
                .multiplier(saved.getMultiplier())
                .description(saved.getDescription())
                .isActive(saved.getIsActive())
                .isRegulatoryReportRequired(saved.getIsRegulatoryReportRequired())
                .statutoryReference(saved.getStatutoryReference())
                .updatedByOfficer(saved.getUpdatedByOfficer())
                .effectiveFrom(saved.getEffectiveFrom())
                .build();
    }

    public ComplianceDashboardSummaryDto getComplianceSummary() {
        long total = amlAlertRepository.count();
        long newAlerts = amlAlertRepository.countByStatus("NEW_ALERT");
        long underInvestigation = amlAlertRepository.countByStatus("UNDER_INVESTIGATION");
        long escalated = amlAlertRepository.countByStatus("ESCALATED_TO_MLRO");
        long strFiled = amlAlertRepository.countByStatus("STR_FILED");
        long closedCases = amlAlertRepository.countByStatus("CLOSED_FALSE_POSITIVE") + amlAlertRepository.countByStatus("CLOSED_EXPLAINED");
        long criticalAlerts = amlAlertRepository.countBySeverity("CRITICAL") + amlAlertRepository.countBySeverity("HIGH");

        long overdueKycs = customerKycProfileRepository.countByNextKycReviewDueDateBefore(LocalDate.now());
        long pendingEdds = customerKycProfileRepository.countByEddStatus("PENDING_REVIEW");

        return ComplianceDashboardSummaryDto.builder()
                .totalAlerts(total)
                .newAlerts(newAlerts)
                .underInvestigation(underInvestigation)
                .escalatedMlro(escalated)
                .strFiled(strFiled)
                .closedCases(closedCases)
                .highSeverityAlerts(criticalAlerts)
                .overdueKycReviews(overdueKycs)
                .pendingEddReviews(pendingEdds)
                .build();
    }

    private AmlAlertDto mapToDto(AmlAlert a) {
        List<AmlCaseNoteDto> notes = amlCaseNoteRepository.findByAlertIdOrderByRecordedAtAsc(a.getId())
                .stream()
                .map(this::mapCaseNoteToDto)
                .collect(Collectors.toList());

        return AmlAlertDto.builder()
                .id(a.getId())
                .alertNumber(a.getAlertNumber())
                .ruleCode(a.getRuleCode())
                .ruleName(a.getRuleName())
                .severity(a.getSeverity())
                .status(a.getStatus())
                .customerId(a.getCustomerId())
                .customerNumber(a.getCustomerNumber())
                .customerName(a.getCustomerName())
                .customerRiskCategory(a.getCustomerRiskCategory())
                .accountNumber(a.getAccountNumber())
                .transactionReference(a.getTransactionReference())
                .transactionAmount(a.getTransactionAmount())
                .transactionType(a.getTransactionType())
                .detectionScore(a.getDetectionScore())
                .triggerDetails(a.getTriggerDetails())
                .assignedOfficer(a.getAssignedOfficer())
                .fiuStrReference(a.getFiuStrReference())
                .detectedTimestamp(a.getDetectedTimestamp())
                .escalatedTimestamp(a.getEscalatedTimestamp())
                .closedTimestamp(a.getClosedTimestamp())
                .closureReason(a.getClosureReason())
                .notes(notes)
                .build();
    }

    private AmlCaseNoteDto mapCaseNoteToDto(AmlCaseNote n) {
        return AmlCaseNoteDto.builder()
                .id(n.getId())
                .alertId(n.getAlertId())
                .authorUsername(n.getAuthorUsername())
                .actionTaken(n.getActionTaken())
                .noteText(n.getNoteText())
                .isConfidential(n.getIsConfidential())
                .recordedAt(n.getRecordedAt())
                .build();
    }
}
