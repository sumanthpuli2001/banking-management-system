package com.apexbank;

import com.apexbank.dto.compliance.AmlCaseActionRequest;
import com.apexbank.dto.compliance.CustomerKycProfileDto;
import com.apexbank.dto.compliance.EddReviewRequest;
import com.apexbank.entity.*;
import com.apexbank.entity.compliance.*;
import com.apexbank.repository.CustomerRepository;
import com.apexbank.repository.TransactionRepository;
import com.apexbank.repository.compliance.*;
import com.apexbank.service.compliance.AmlMonitoringEngineService;
import com.apexbank.service.compliance.KycRiskManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ComplianceAmlServiceTest {

    @Mock private AmlAlertRepository amlAlertRepository;
    @Mock private AmlCaseNoteRepository amlCaseNoteRepository;
    @Mock private AmlRuleConfigRepository amlRuleConfigRepository;
    @Mock private CustomerKycProfileRepository customerKycProfileRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private CustomerRepository customerRepository;

    private AmlMonitoringEngineService amlService;
    private KycRiskManagementService kycService;

    private Customer testCustomer;
    private BankAccount testAccount;
    private AmlRuleConfig ctrRule;
    private AmlRuleConfig structuringRule;
    private AmlRuleConfig incomeRule;
    private AmlRuleConfig pepRule;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        amlService = new AmlMonitoringEngineService(
                amlAlertRepository,
                amlCaseNoteRepository,
                amlRuleConfigRepository,
                customerKycProfileRepository,
                transactionRepository,
                customerRepository
        );

        kycService = new KycRiskManagementService(
                customerKycProfileRepository,
                customerRepository
        );

        testCustomer = Customer.builder()
                .id(101L)
                .customerNumber("CIF-100234")
                .fullName("Rajesh Verma")
                .riskCategory("LOW")
                .annualIncome(new BigDecimal("600000.00")) // ₹6 Lakhs
                .build();

        testAccount = BankAccount.builder()
                .id(501L)
                .accountNumber("1000200030004001")
                .customer(testCustomer)
                .balance(new BigDecimal("2500000.00"))
                .availableBalance(new BigDecimal("2500000.00"))
                .currency("INR")
                .build();

        ctrRule = AmlRuleConfig.builder()
                .id(1L)
                .ruleCode("RULE_LARGE_CASH_CTR")
                .ruleName("High-Value Cash Transaction (CTR)")
                .severity("CRITICAL")
                .thresholdAmount(new BigDecimal("1000000.00"))
                .isActive(true)
                .build();

        structuringRule = AmlRuleConfig.builder()
                .id(2L)
                .ruleCode("RULE_STRUCTURING_SMURF")
                .ruleName("Suspected Cash Structuring")
                .severity("CRITICAL")
                .thresholdAmount(new BigDecimal("1000000.00"))
                .lookbackHours(48)
                .isActive(true)
                .build();

        incomeRule = AmlRuleConfig.builder()
                .id(3L)
                .ruleCode("RULE_INCOME_INCONSISTENCY")
                .ruleName("Activity Inconsistent with Income")
                .severity("MEDIUM")
                .thresholdAmount(new BigDecimal("1500000.00"))
                .multiplier(BigDecimal.valueOf(3.0))
                .isActive(true)
                .build();

        pepRule = AmlRuleConfig.builder()
                .id(4L)
                .ruleCode("RULE_PEP_HIGH_RISK")
                .ruleName("High-Risk / PEP Threshold")
                .severity("HIGH")
                .thresholdAmount(new BigDecimal("500000.00"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("AML Engine: Single cash deposit >= ₹10L generates CTR Critical Alert")
    void testLargeCashCtrTrigger_GeneratesCriticalAlert() {
        when(amlRuleConfigRepository.findByIsActiveTrue()).thenReturn(List.of(ctrRule));
        when(amlAlertRepository.save(any(AmlAlert.class))).thenAnswer(inv -> {
            AmlAlert a = inv.getArgument(0);
            a.setId(991L);
            return a;
        });

        Transaction txn = Transaction.builder()
                .id(701L)
                .referenceNumber("TXN-CTR-001")
                .sourceAccount(testAccount)
                .amount(new BigDecimal("1500000.00")) // ₹15 Lakhs
                .transactionType(TransactionType.CASH_DEPOSIT)
                .transactionTimestamp(LocalDateTime.now())
                .build();

        List<AmlAlert> alerts = amlService.evaluateTransaction(txn);

        assertEquals(1, alerts.size());
        AmlAlert alert = alerts.get(0);
        assertEquals("RULE_LARGE_CASH_CTR", alert.getRuleCode());
        assertEquals("CRITICAL", alert.getSeverity());
        assertEquals("NEW_ALERT", alert.getStatus());
        assertEquals(95, alert.getDetectionScore());
        assertEquals("1000200030004001", alert.getAccountNumber());
        assertTrue(alert.getTriggerDetails().contains("CTR reporting threshold"));

        verify(amlCaseNoteRepository, times(1)).save(any(AmlCaseNote.class));
    }

    @Test
    @DisplayName("AML Engine: Multiple cash transactions in 48h aggregating >= ₹10L triggers Structuring Alert")
    void testStructuringSmurfingDetection_MultipleCashTxnsBreachingAggregate() {
        when(amlRuleConfigRepository.findByIsActiveTrue()).thenReturn(List.of(structuringRule));
        when(amlAlertRepository.save(any(AmlAlert.class))).thenAnswer(inv -> {
            AmlAlert a = inv.getArgument(0);
            a.setId(992L);
            return a;
        });

        // 2 prior cash txns of ₹3.5L and ₹4L in 48h
        Transaction prevTxn1 = Transaction.builder().amount(new BigDecimal("350000.00")).transactionType(TransactionType.CASH_DEPOSIT).build();
        Transaction prevTxn2 = Transaction.builder().amount(new BigDecimal("400000.00")).transactionType(TransactionType.CASH_DEPOSIT).build();
        Transaction currentTxn = Transaction.builder().amount(new BigDecimal("300000.00")).transactionType(TransactionType.CASH_DEPOSIT).build();

        when(transactionRepository.findRecentCashTransactionsByAccount(eq(501L), any(LocalDateTime.class)))
                .thenReturn(List.of(prevTxn1, prevTxn2, currentTxn));

        Transaction txn = Transaction.builder()
                .id(702L)
                .referenceNumber("TXN-SMURF-001")
                .sourceAccount(testAccount)
                .amount(new BigDecimal("300000.00")) // Under ₹10L individually
                .transactionType(TransactionType.CASH_DEPOSIT)
                .transactionTimestamp(LocalDateTime.now())
                .build();

        List<AmlAlert> alerts = amlService.evaluateTransaction(txn);

        assertEquals(1, alerts.size());
        AmlAlert alert = alerts.get(0);
        assertEquals("RULE_STRUCTURING_SMURF", alert.getRuleCode());
        assertEquals("CRITICAL", alert.getSeverity());
        assertTrue(alert.getTriggerDetails().contains("Suspected Structuring"));
    }

    @Test
    @DisplayName("AML Engine: Transaction exceeding 3x customer declared annual income triggers Income Inconsistency")
    void testIncomeInconsistencyRule_ExceedsThreeTimesDeclaredIncome() {
        when(amlRuleConfigRepository.findByIsActiveTrue()).thenReturn(List.of(incomeRule));
        when(amlAlertRepository.save(any(AmlAlert.class))).thenAnswer(inv -> {
            AmlAlert a = inv.getArgument(0);
            a.setId(993L);
            return a;
        });

        // Customer annual income is ₹6L. 3x is ₹18L. Txn is ₹25L.
        Transaction txn = Transaction.builder()
                .id(703L)
                .referenceNumber("TXN-INC-001")
                .sourceAccount(testAccount)
                .amount(new BigDecimal("2500000.00")) // ₹25 Lakhs
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .transactionTimestamp(LocalDateTime.now())
                .build();

        List<AmlAlert> alerts = amlService.evaluateTransaction(txn);

        assertEquals(1, alerts.size());
        AmlAlert alert = alerts.get(0);
        assertEquals("RULE_INCOME_INCONSISTENCY", alert.getRuleCode());
        assertTrue(alert.getTriggerDetails().contains("declared annual income profile"));
    }

    @Test
    @DisplayName("AML Engine: Politically Exposed Person (PEP) transaction >= ₹5L triggers High-Risk Monitor")
    void testPepHighRiskActivityTrigger() {
        testCustomer.setRiskCategory("PEP");
        when(amlRuleConfigRepository.findByIsActiveTrue()).thenReturn(List.of(pepRule));
        when(amlAlertRepository.save(any(AmlAlert.class))).thenAnswer(inv -> {
            AmlAlert a = inv.getArgument(0);
            a.setId(994L);
            return a;
        });

        Transaction txn = Transaction.builder()
                .id(704L)
                .referenceNumber("TXN-PEP-001")
                .sourceAccount(testAccount)
                .amount(new BigDecimal("750000.00")) // ₹7.5 Lakhs
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .transactionTimestamp(LocalDateTime.now())
                .build();

        List<AmlAlert> alerts = amlService.evaluateTransaction(txn);

        assertEquals(1, alerts.size());
        AmlAlert alert = alerts.get(0);
        assertEquals("RULE_PEP_HIGH_RISK", alert.getRuleCode());
        assertEquals("HIGH", alert.getSeverity());
    }

    @Test
    @DisplayName("Case Management: Full lifecycle from Investigation to MLRO Escalation and STR Filing")
    void testAmlCaseLifecycle_Investigate_Escalate_FileStr() {
        AmlAlert alert = AmlAlert.builder()
                .id(881L)
                .alertNumber("AML-20261115-1001")
                .ruleCode("RULE_LARGE_CASH_CTR")
                .ruleName("High-Value Cash Transaction")
                .severity("CRITICAL")
                .status("NEW_ALERT")
                .customerId(101L)
                .accountNumber("1000200030004001")
                .detectedTimestamp(LocalDateTime.now())
                .build();

        when(amlAlertRepository.findById(881L)).thenReturn(Optional.of(alert));
        when(amlAlertRepository.save(any(AmlAlert.class))).thenAnswer(inv -> inv.getArgument(0));

        // Step 1: Assign and Investigate
        AmlCaseActionRequest req1 = AmlCaseActionRequest.builder()
                .action("INVESTIGATE")
                .note("Commencing formal transaction review with account officer.")
                .assignedOfficer("ananya.compliance")
                .build();
        var dto1 = amlService.processCaseAction(881L, req1, "ananya.compliance");
        assertEquals("UNDER_INVESTIGATION", dto1.getStatus());
        assertEquals("ananya.compliance", dto1.getAssignedOfficer());

        // Step 2: Escalate to MLRO
        AmlCaseActionRequest req2 = AmlCaseActionRequest.builder()
                .action("ESCALATE_MLRO")
                .note("Unjustified commercial cash movement; escalating for Money Laundering Reporting Officer determination.")
                .build();
        var dto2 = amlService.processCaseAction(881L, req2, "ananya.compliance");
        assertEquals("ESCALATED_TO_MLRO", dto2.getStatus());

        // Step 3: File STR with FIU-IND
        AmlCaseActionRequest req3 = AmlCaseActionRequest.builder()
                .action("FILE_STR")
                .note("Filing statutory Suspicious Transaction Report to FIU-IND under PMLA Section 12.")
                .fiuStrReference("FIU-IND-STR-2026-98124")
                .build();
        var dto3 = amlService.processCaseAction(881L, req3, "mlro.officer");
        assertEquals("STR_FILED", dto3.getStatus());
        assertEquals("FIU-IND-STR-2026-98124", dto3.getFiuStrReference());

        // Verify 3 case audit notes recorded
        verify(amlCaseNoteRepository, times(3)).save(any(AmlCaseNote.class));
    }

    @Test
    @DisplayName("KYC Engine: Statutory periodic review due dates by RBI risk classification")
    void testKycPeriodicReviewDueDates_ByRiskCategory() {
        LocalDate baseDate = LocalDate.of(2026, 11, 15);

        // High & PEP: 2 years
        LocalDate highDue = kycService.calculateNextReviewDueDate("HIGH", baseDate);
        assertEquals(LocalDate.of(2028, 11, 15), highDue);

        LocalDate pepDue = kycService.calculateNextReviewDueDate("PEP", baseDate);
        assertEquals(LocalDate.of(2028, 11, 15), pepDue);

        // Medium: 8 years
        LocalDate medDue = kycService.calculateNextReviewDueDate("MEDIUM", baseDate);
        assertEquals(LocalDate.of(2034, 11, 15), medDue);

        // Low: 10 years
        LocalDate lowDue = kycService.calculateNextReviewDueDate("LOW", baseDate);
        assertEquals(LocalDate.of(2036, 11, 15), lowDue);
    }

    @Test
    @DisplayName("KYC Engine: Enhanced Due Diligence (EDD) sign-off workflow for high-risk customer")
    void testEddApprovalWorkflow_HighRiskPepCustomer() {
        testCustomer.setRiskCategory("HIGH");
        when(customerRepository.findById(101L)).thenReturn(Optional.of(testCustomer));

        CustomerKycProfile profile = CustomerKycProfile.builder()
                .id(441L)
                .customerId(101L)
                .cddStatus("SIMULATED_VERIFIED")
                .riskCategory("HIGH")
                .eddStatus("PENDING_REVIEW")
                .lastKycReviewDate(LocalDate.now().minusMonths(6))
                .nextKycReviewDueDate(LocalDate.now().plusMonths(18))
                .build();

        when(customerKycProfileRepository.findByCustomerId(101L)).thenReturn(Optional.of(profile));
        when(customerKycProfileRepository.save(any(CustomerKycProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        EddReviewRequest request = EddReviewRequest.builder()
                .decision("APPROVE")
                .sourceOfWealth("Inherited Commercial Real Estate & High-Tech Equity Dividends")
                .beneficialOwnership("Direct 100% Shareholding in Verma Global Holdings")
                .remarks("Senior Compliance Committee approved EDD dossier after forensic review.")
                .build();

        CustomerKycProfileDto result = kycService.processEddReview(101L, request, "vikram.compliance_head");

        assertEquals("APPROVED", result.getEddStatus());
        assertEquals("vikram.compliance_head", result.getEddApprovedBy());
        assertNotNull(result.getEddApprovedAt());
        assertTrue(result.getEddSourceOfWealth().contains("Inherited Commercial Real Estate"));
        assertEquals(LocalDate.now().plusYears(2), result.getNextKycReviewDueDate());
    }
}
