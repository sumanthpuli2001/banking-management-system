package com.apexbank;

import com.apexbank.dto.regulatory.*;
import com.apexbank.entity.*;
import com.apexbank.entity.regulatory.*;
import com.apexbank.repository.*;
import com.apexbank.repository.regulatory.*;
import com.apexbank.service.AuditService;
import com.apexbank.service.regulatory.RegulatoryLiquidityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class RegulatoryLiquidityServiceTest {

    @Mock private RegulatoryConfigRepository configRepository;
    @Mock private EligibleLiquidAssetRepository liquidAssetRepository;
    @Mock private ReserveCalculationHistoryRepository calculationHistoryRepository;
    @Mock private RegulatoryReportingPeriodRepository reportingPeriodRepository;
    @Mock private LiquidityAlertRepository alertRepository;
    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private FixedDepositRepository fixedDepositRepository;
    @Mock private RecurringDepositRepository recurringDepositRepository;
    @Mock private GLAccountRepository glAccountRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private AuditService auditService;

    private RegulatoryLiquidityService regulatoryService;

    private User riskOfficer;
    private GLAccount savingsGl;
    private GLAccount currentGl;
    private GLAccount fdGl;
    private GLAccount rdGl;
    private GLAccount rbiReserveGl;
    private GLAccount vaultCashGl;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        regulatoryService = new RegulatoryLiquidityService(
                configRepository,
                liquidAssetRepository,
                calculationHistoryRepository,
                reportingPeriodRepository,
                alertRepository,
                bankAccountRepository,
                fixedDepositRepository,
                recurringDepositRepository,
                glAccountRepository,
                branchRepository,
                auditService
        );

        riskOfficer = User.builder().id(10L).username("chief_risk_officer").build();

        // Setup GL Accounts
        savingsGl = GLAccount.builder().accountCode("2010-DEMAND-DEPOSITS-SAVINGS").currentBalance(new BigDecimal("1000000000.00")).build();
        currentGl = GLAccount.builder().accountCode("2020-DEMAND-DEPOSITS-CURRENT").currentBalance(new BigDecimal("300000000.00")).build();
        fdGl = GLAccount.builder().accountCode("2030-TERM-DEPOSITS-FD").currentBalance(new BigDecimal("400000000.00")).build();
        rdGl = GLAccount.builder().accountCode("2040-RECURRING-DEPOSITS-RD").currentBalance(new BigDecimal("100000000.00")).build();
        rbiReserveGl = GLAccount.builder().accountCode("1040-RBI-RESERVE-BALANCE").currentBalance(new BigDecimal("95000000.00")).build();
        vaultCashGl = GLAccount.builder().accountCode("1010-CASH-VAULT").currentBalance(new BigDecimal("50000000.00")).build();

        when(glAccountRepository.findByAccountCode("2010-DEMAND-DEPOSITS-SAVINGS")).thenReturn(Optional.of(savingsGl));
        when(glAccountRepository.findByAccountCode("2020-DEMAND-DEPOSITS-CURRENT")).thenReturn(Optional.of(currentGl));
        when(glAccountRepository.findByAccountCode("2030-TERM-DEPOSITS-FD")).thenReturn(Optional.of(fdGl));
        when(glAccountRepository.findByAccountCode("2040-RECURRING-DEPOSITS-RD")).thenReturn(Optional.of(rdGl));
        when(glAccountRepository.findByAccountCode("1040-RBI-RESERVE-BALANCE")).thenReturn(Optional.of(rbiReserveGl));
        when(glAccountRepository.findByAccountCode("1010-CASH-VAULT")).thenReturn(Optional.of(vaultCashGl));

        // Setup Regulatory Configs
        RegulatoryConfig crrConfig = RegulatoryConfig.builder()
                .parameterKey("CRR_RATE")
                .parameterValue(new BigDecimal("4.5000"))
                .effectiveDate(LocalDate.now().minusMonths(1))
                .sourceCircularReference("RBI Section 42(1)")
                .isActive(true)
                .build();

        RegulatoryConfig slrConfig = RegulatoryConfig.builder()
                .parameterKey("SLR_RATE")
                .parameterValue(new BigDecimal("18.0000"))
                .effectiveDate(LocalDate.now().minusMonths(1))
                .sourceCircularReference("BR Act Section 24")
                .isActive(true)
                .build();

        RegulatoryConfig minDailyConfig = RegulatoryConfig.builder()
                .parameterKey("MIN_DAILY_CRR_MAINTENANCE_PCT")
                .parameterValue(new BigDecimal("90.0000"))
                .effectiveDate(LocalDate.now().minusMonths(1))
                .isActive(true)
                .build();

        when(configRepository.findByParameterKeyAndIsActiveTrue("CRR_RATE")).thenReturn(Optional.of(crrConfig));
        when(configRepository.findByParameterKeyAndIsActiveTrue("SLR_RATE")).thenReturn(Optional.of(slrConfig));
        when(configRepository.findByParameterKeyAndIsActiveTrue("MIN_DAILY_CRR_MAINTENANCE_PCT")).thenReturn(Optional.of(minDailyConfig));

        // Setup Qualifying Securities for SLR
        EligibleLiquidAsset gsec = EligibleLiquidAsset.builder()
                .assetIdentifier("IN0020230085")
                .assetType("CENTRAL_GOVT_SECURITY")
                .marketValue(new BigDecimal("300000000.00"))
                .isEncumbered(false)
                .build();

        EligibleLiquidAsset tbill = EligibleLiquidAsset.builder()
                .assetIdentifier("IN002023X048")
                .assetType("TREASURY_BILL")
                .marketValue(new BigDecimal("100000000.00"))
                .isEncumbered(false)
                .build();

        when(liquidAssetRepository.findByIsEncumberedFalseOrderByMarketValueDesc()).thenReturn(List.of(gsec, tbill));
        when(liquidAssetRepository.sumTotalEligibleLiquidAssets()).thenReturn(new BigDecimal("400000000.00"));

        when(calculationHistoryRepository.save(any(ReserveCalculationHistory.class))).thenAnswer(inv -> {
            ReserveCalculationHistory h = inv.getArgument(0);
            h.setId(101L);
            return h;
        });

        when(configRepository.save(any(RegulatoryConfig.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Dynamic NDTL Calculation applies statutory RBI formula accurately")
    void testDynamicNdtlCalculationBreakdown() {
        NdtlCalculationBreakdownDto ndtl = regulatoryService.calculateNdtl(LocalDate.now());

        assertNotNull(ndtl);
        assertEquals(new BigDecimal("1000000000.00"), ndtl.getSavingsAccountDeposits());
        assertEquals(new BigDecimal("300000000.00"), ndtl.getCurrentAccountDeposits());
        assertEquals(new BigDecimal("1345000000.00"), ndtl.getTotalDemandLiabilities()); // 1000M + 300M + 45M overdue
        assertEquals(new BigDecimal("500000000.00"), ndtl.getTotalTimeLiabilities());   // 400M FD + 100M RD
        assertTrue(ndtl.getNetDemandTimeLiabilities().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(ndtl.getCentralBankCircularReference());
    }

    @Test
    @DisplayName("CRR Position calculation verifies required vs actual balances with RBI under Section 42(1)")
    void testCrrPositionCalculationAndCompliance() {
        BigDecimal ndtl = new BigDecimal("1800000000.00"); // 1.8 Billion INR
        CrrMonitoringDto crr = regulatoryService.calculateCrrPosition(LocalDate.now(), ndtl);

        assertNotNull(crr);
        assertEquals(new BigDecimal("4.5000"), crr.getPrescribedCrrRate());
        // Required = 1.8B * 4.5% = 81,000,000.00
        assertEquals(new BigDecimal("81000000.0000"), crr.getRequiredCrrAmount());
        // Actual balance with RBI = 95,000,000.00
        assertEquals(new BigDecimal("95000000.00"), crr.getActualBalanceWithRbi());
        // Surplus = 95M - 81M = 14M
        assertTrue(crr.getSurplusDeficitAmount().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(crr.isCompliant());
        assertEquals("COMPLIANT", crr.getComplianceStatus());
    }

    @Test
    @DisplayName("SLR Position calculation aggregates G-Secs, T-Bills, Vault Cash and Excess CRR under Section 24")
    void testSlrPositionCalculationWithQualifyingSecurities() {
        BigDecimal ndtl = new BigDecimal("1800000000.00");
        CrrMonitoringDto crr = regulatoryService.calculateCrrPosition(LocalDate.now(), ndtl);
        SlrMonitoringDto slr = regulatoryService.calculateSlrPosition(LocalDate.now(), ndtl, crr);

        assertNotNull(slr);
        assertEquals(new BigDecimal("18.0000"), slr.getPrescribedSlrRate());
        // Required SLR = 1.8B * 18% = 324,000,000.00
        assertEquals(new BigDecimal("324000000.0000"), slr.getRequiredSlrAmount());
        // Total Eligible = 300M (G-Sec) + 100M (T-Bill) + 50M (Vault Cash) + 14M (Excess CRR) = 464,000,000.00
        assertTrue(slr.getTotalEligibleLiquidAssets().compareTo(slr.getRequiredSlrAmount()) > 0);
        assertTrue(slr.isCompliant());
        assertEquals("COMPLIANT", slr.getComplianceStatus());
    }

    @Test
    @DisplayName("Regulatory Configuration can be updated dynamically with source circular and effective date")
    void testRegulatoryConfigUpdateWithoutHardcoding() {
        UpdateRegulatoryConfigRequest request = UpdateRegulatoryConfigRequest.builder()
                .parameterKey("CRR_RATE")
                .parameterValue(new BigDecimal("4.7500"))
                .effectiveDate(LocalDate.of(2026, 12, 1))
                .sourceCircularReference("RBI/2026-27/12 Monetary Policy Committee Directive")
                .description("Hike in CRR by 25 bps to absorb excess banking liquidity")
                .build();

        RegulatoryConfig updated = regulatoryService.updateRegulatoryConfig(request, riskOfficer);

        assertNotNull(updated);
        assertEquals("CRR_RATE", updated.getParameterKey());
        assertEquals(new BigDecimal("4.7500"), updated.getParameterValue());
        assertEquals(LocalDate.of(2026, 12, 1), updated.getEffectiveDate());
        assertEquals("chief_risk_officer", updated.getUpdatedBy());
    }

    @Test
    @DisplayName("Simulate Calculation supports stress test scenario with deposit outflow drain percentage")
    void testSimulateCalculationStressScenario() {
        SimulateLiquidityCalculationRequest request = SimulateLiquidityCalculationRequest.builder()
                .calculationDate(LocalDate.now())
                .stressScenarioDepositDrainPct(new BigDecimal("10.00")) // 10% sudden deposit drain
                .customCrrRate(new BigDecimal("5.00")) // Stress hike
                .customSlrRate(new BigDecimal("19.00"))
                .simulationNotes("Q4 Stress Test: Sudden 10% deposit withdrawal run combined with 50 bps CRR hike")
                .build();

        ReserveCalculationHistory record = regulatoryService.simulateCalculation(request, riskOfficer);

        assertNotNull(record);
        assertEquals("SIMULATED_REGULATORY", record.getCalculationClassification());
        assertFalse(record.getIsRegulatoryVerified());
        assertEquals("chief_risk_officer", record.getCalculatedBy());
        assertTrue(record.getCalculationDetailsJson().contains("Q4 Stress Test"));
    }

    @Test
    @DisplayName("Statutory Sign-Off promotes simulated calculation to Audited Statutory status with officer verification")
    void testStatutorySignOffWorkflow() {
        ReserveCalculationHistory mockRecord = ReserveCalculationHistory.builder()
                .id(202L)
                .reportingFortnight("FN-2026-23")
                .calculationClassification("SIMULATED_REGULATORY")
                .isRegulatoryVerified(false)
                .build();

        when(calculationHistoryRepository.findById(202L)).thenReturn(Optional.of(mockRecord));

        ReserveCalculationHistory verified = regulatoryService.verifyAndSignOffReporting(202L, riskOfficer);

        assertNotNull(verified);
        assertTrue(verified.getIsRegulatoryVerified());
        assertEquals("AUDITED_STATUTORY", verified.getCalculationClassification());
        assertEquals("chief_risk_officer", verified.getVerifiedBy());
        assertNotNull(verified.getVerifiedAt());
    }

    @Test
    @DisplayName("Liquidity Alert is triggered and recorded when a reserve ratio falls into deficit")
    void testLiquidityAlertTriggerOnDeficit() {
        // Force high required CRR (e.g. 15%) while keeping actual balance at 95M
        SimulateLiquidityCalculationRequest stressRequest = SimulateLiquidityCalculationRequest.builder()
                .calculationDate(LocalDate.now())
                .customCrrRate(new BigDecimal("15.0000")) // Needs ~270M, but actual is 95M -> Deficit
                .customSlrRate(new BigDecimal("40.0000")) // Needs ~720M, but actual is 400M -> Deficit
                .simulationNotes("Extreme stress scenario testing deficit alert generation")
                .build();

        regulatoryService.simulateCalculation(stressRequest, riskOfficer);

        // Verify alertRepository.save was invoked for DEFICIT
        verify(alertRepository, atLeastOnce()).save(any(LiquidityAlert.class));
    }
}
