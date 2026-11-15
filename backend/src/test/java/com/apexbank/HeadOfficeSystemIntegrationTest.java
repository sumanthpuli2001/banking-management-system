package com.apexbank;

import com.apexbank.dto.dashboard.HeadOfficeDashboardDto;
import com.apexbank.dto.eod.EodExecutionResponseDto;
import com.apexbank.dto.regulatory.CrrMonitoringDto;
import com.apexbank.dto.regulatory.RegulatoryDashboardDto;
import com.apexbank.dto.regulatory.SlrMonitoringDto;
import com.apexbank.entity.*;
import com.apexbank.entity.eod.EodBatchRun;
import com.apexbank.entity.eod.EodBatchStep;
import com.apexbank.repository.*;
import com.apexbank.repository.compliance.AmlAlertRepository;
import com.apexbank.repository.eod.EodBatchRunRepository;
import com.apexbank.repository.eod.EodBatchStepRepository;
import com.apexbank.service.AuditService;
import com.apexbank.service.DashboardService;
import com.apexbank.service.eod.EodBatchService;
import com.apexbank.service.regulatory.RegulatoryLiquidityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HeadOfficeSystemIntegrationTest {

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private FixedDepositRepository fixedDepositRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;

    @Mock
    private AmlAlertRepository amlAlertRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private EodBatchRunRepository eodBatchRunRepository;

    @Mock
    private EodBatchStepRepository eodBatchStepRepository;

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @Mock
    private AccountingPeriodRepository accountingPeriodRepository;

    @Mock
    private RegulatoryLiquidityService regulatoryLiquidityService;

    @Mock
    private AuditService auditService;

    private DashboardService dashboardService;
    private EodBatchService eodBatchService;

    private User adminUser;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
                branchRepository,
                regionRepository,
                userRepository,
                customerRepository,
                bankAccountRepository,
                loanRepository,
                fixedDepositRepository,
                transactionRepository,
                approvalRequestRepository,
                amlAlertRepository,
                auditLogRepository,
                eodBatchRunRepository,
                regulatoryLiquidityService
        );

        eodBatchService = new EodBatchService(
                eodBatchRunRepository,
                eodBatchStepRepository,
                branchRepository,
                bankAccountRepository,
                journalEntryRepository,
                accountingPeriodRepository,
                regulatoryLiquidityService,
                auditService
        );

        adminUser = User.builder()
                .id(1L)
                .username("ho.admin")
                .fullName("Central Head Office Administrator")
                .email("admin@apexbank.com")
                .build();
    }

    @Test
    @DisplayName("Head Office KPI Consolidation: Aggregates real deposits, advances, and branches")
    void testHeadOfficeDashboardKpiConsolidation() {
        when(branchRepository.count()).thenReturn(6L);
        when(regionRepository.count()).thenReturn(3L);
        when(customerRepository.count()).thenReturn(14820L);
        when(bankAccountRepository.count()).thenReturn(19450L);
        when(bankAccountRepository.sumTotalBankDeposits()).thenReturn(new BigDecimal("1845200000.00"));
        when(loanRepository.sumTotalActiveAdvances()).thenReturn(new BigDecimal("1210400000.00"));

        Branch b1 = Branch.builder().id(1L).branchCode("BLR001").name("Bangalore Central").build();
        when(branchRepository.findAll()).thenReturn(List.of(b1));

        HeadOfficeDashboardDto dto = dashboardService.getHeadOfficeSummary();

        assertNotNull(dto);
        assertEquals(6L, dto.getTotalBranches());
        assertEquals(3L, dto.getTotalRegionalOffices());
        assertEquals(new BigDecimal("1845200000.00"), dto.getTotalBankDeposits());
        assertEquals(new BigDecimal("1210400000.00"), dto.getTotalBankAdvances());
        assertFalse(dto.getBranchPerformance().isEmpty());
    }

    @Test
    @DisplayName("Regulatory Synchronization: Ingests CRR, SLR ratios and compliance status into dashboard")
    void testRegulatoryLiquidityMetricsSynchronization() {
        CrrMonitoringDto crrDto = CrrMonitoringDto.builder()
                .prescribedCrrRate(new BigDecimal("4.50"))
                .isCompliant(true)
                .build();

        SlrMonitoringDto slrDto = SlrMonitoringDto.builder()
                .prescribedSlrRate(new BigDecimal("18.00"))
                .isCompliant(true)
                .build();

        RegulatoryDashboardDto regResp = RegulatoryDashboardDto.builder()
                .crrPosition(crrDto)
                .slrPosition(slrDto)
                .compositeReserveRatio(new BigDecimal("22.50"))
                .build();

        when(regulatoryLiquidityService.getRegulatoryDashboard()).thenReturn(regResp);

        HeadOfficeDashboardDto dto = dashboardService.getHeadOfficeSummary();

        assertNotNull(dto);
        assertEquals(new BigDecimal("4.50"), dto.getCrrPercentage());
        assertEquals(new BigDecimal("18.00"), dto.getSlrPercentage());
        assertTrue(dto.getCrrCompliant());
        assertTrue(dto.getSlrCompliant());
    }

    @Test
    @DisplayName("Governance & Risk Feeds: Ingests pending dual-control and AML alerts")
    void testDualControlGovernanceAndRiskAlertCounts() {
        when(approvalRequestRepository.countByStatus("PENDING")).thenReturn(7L);
        when(approvalRequestRepository.countByIsEscalatedTrueAndStatus("PENDING")).thenReturn(2L);
        when(amlAlertRepository.countByStatus("OPEN")).thenReturn(4L);

        HeadOfficeDashboardDto dto = dashboardService.getHeadOfficeSummary();

        assertEquals(7L, dto.getPendingMakerCheckerCount());
        assertEquals(2L, dto.getEscalatedMakerCheckerCount());
        assertEquals(4L, dto.getActiveAmlAlertsCount());
    }

    @Test
    @DisplayName("EOD Batch Closing Pipeline: Executes all 5 automated closing steps successfully")
    void testEodBatchClosingExecutionPipeline() {
        when(branchRepository.count()).thenReturn(6L);

        // Balanced journal entries proof: DR 50000 == CR 50000
        JournalEntry balancedEntry = JournalEntry.builder()
                .id(1L)
                .entryNumber("JE-2026-001")
                .totalDebit(new BigDecimal("50000.00"))
                .totalCredit(new BigDecimal("50000.00"))
                .status("POSTED")
                .build();
        when(journalEntryRepository.findAll()).thenReturn(List.of(balancedEntry));

        BankAccount acc = BankAccount.builder()
                .id(101L)
                .balance(new BigDecimal("1000000.00"))
                .build();
        when(bankAccountRepository.findAll()).thenReturn(List.of(acc));

        when(eodBatchRunRepository.save(any(EodBatchRun.class))).thenAnswer(i -> {
            EodBatchRun r = i.getArgument(0);
            if (r.getId() == null) r.setId(99L);
            return r;
        });

        when(eodBatchStepRepository.save(any(EodBatchStep.class))).thenAnswer(i -> i.getArgument(0));

        EodExecutionResponseDto response = eodBatchService.executeEodBatch(LocalDate.now(), adminUser);

        assertTrue(response.isSuccess());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("EOD", response.getBatchType());
        assertEquals(5, response.getExecutedSteps().size());

        // Verify all 5 steps passed
        assertTrue(response.getExecutedSteps().stream().allMatch(s -> "SUCCESS".equals(s.getStatus())));
        verify(auditService, times(1)).recordAudit(any(), eq("EOD_BATCH_COMPLETED"), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("SOD Batch Opening Pipeline: Initializes teller drawers and activates business day")
    void testSodBatchExecutionPipeline() {
        when(branchRepository.count()).thenReturn(6L);

        when(eodBatchRunRepository.save(any(EodBatchRun.class))).thenAnswer(i -> {
            EodBatchRun r = i.getArgument(0);
            if (r.getId() == null) r.setId(100L);
            return r;
        });

        when(eodBatchStepRepository.save(any(EodBatchStep.class))).thenAnswer(i -> i.getArgument(0));

        EodExecutionResponseDto response = eodBatchService.executeSodBatch(LocalDate.now(), adminUser);

        assertTrue(response.isSuccess());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("SOD", response.getBatchType());
        assertEquals(3, response.getExecutedSteps().size());
        verify(auditService, times(1)).recordAudit(any(), eq("SOD_BATCH_COMPLETED"), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("EOD Journal Proof: Detects unbalanced journal entries and flags discrepancy")
    void testEodBatchUnbalancedJournalDetection() {
        when(branchRepository.count()).thenReturn(6L);

        // Unbalanced entry: DR 50000 != CR 40000 (discrepancy)
        JournalEntry unBalancedEntry = JournalEntry.builder()
                .id(2L)
                .entryNumber("JE-UNBALANCED-002")
                .totalDebit(new BigDecimal("50000.00"))
                .totalCredit(new BigDecimal("40000.00"))
                .status("POSTED")
                .build();
        when(journalEntryRepository.findAll()).thenReturn(List.of(unBalancedEntry));

        when(bankAccountRepository.findAll()).thenReturn(Collections.emptyList());

        when(eodBatchRunRepository.save(any(EodBatchRun.class))).thenAnswer(i -> {
            EodBatchRun r = i.getArgument(0);
            if (r.getId() == null) r.setId(101L);
            return r;
        });

        when(eodBatchStepRepository.save(any(EodBatchStep.class))).thenAnswer(i -> i.getArgument(0));

        EodExecutionResponseDto response = eodBatchService.executeEodBatch(LocalDate.now(), adminUser);

        assertFalse(response.isSuccess());
        assertEquals("FAILED", response.getStatus());
        assertTrue(response.getMessage().contains("journal balancing discrepancy"));
    }
}
