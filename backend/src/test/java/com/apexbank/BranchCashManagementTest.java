package com.apexbank;

import com.apexbank.dto.branchcash.*;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.repository.*;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import com.apexbank.service.BranchCashManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class BranchCashManagementTest {

    @Mock private BranchRepository branchRepository;
    @Mock private UserRepository userRepository;
    @Mock private TellerCashDrawerRepository drawerRepository;
    @Mock private TellerHandoverRepository handoverRepository;
    @Mock private CashShortageExcessRepository shortageExcessRepository;
    @Mock private InterBranchCashTransferRepository interBranchTransferRepository;
    @Mock private AccountingEngineService accountingEngineService;
    @Mock private AuditService auditService;

    private BranchCashManagementService branchCashService;

    private Branch sourceBranch;
    private Branch destBranch;
    private User cashier;
    private User branchManager;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        branchCashService = new BranchCashManagementService(
                branchRepository,
                userRepository,
                drawerRepository,
                handoverRepository,
                shortageExcessRepository,
                interBranchTransferRepository,
                accountingEngineService,
                auditService
        );

        sourceBranch = Branch.builder()
                .id(1L)
                .branchCode("BLR-001")
                .name("Bangalore MG Road Central")
                .cashVaultBalance(new BigDecimal("10000000.00"))
                .build();

        destBranch = Branch.builder()
                .id(2L)
                .branchCode("MUM-001")
                .name("Mumbai Fort Financial District")
                .cashVaultBalance(new BigDecimal("8000000.00"))
                .build();

        cashier = User.builder()
                .id(10L)
                .username("cashier_blr")
                .fullName("Girish Patel")
                .branch(sourceBranch)
                .build();

        branchManager = User.builder()
                .id(5L)
                .username("bm_bangalore")
                .fullName("Ananya Shenoy")
                .branch(sourceBranch)
                .build();

        when(drawerRepository.save(any(TellerCashDrawer.class))).thenAnswer(i -> {
            TellerCashDrawer d = i.getArgument(0);
            if (d.getId() == null) d.setId(501L);
            return d;
        });

        when(handoverRepository.save(any(TellerHandover.class))).thenAnswer(i -> {
            TellerHandover h = i.getArgument(0);
            if (h.getId() == null) h.setId(601L);
            return h;
        });

        when(shortageExcessRepository.save(any(CashShortageExcessRecord.class))).thenAnswer(i -> {
            CashShortageExcessRecord s = i.getArgument(0);
            if (s.getId() == null) s.setId(701L);
            return s;
        });

        when(interBranchTransferRepository.save(any(InterBranchCashTransfer.class))).thenAnswer(i -> {
            InterBranchCashTransfer t = i.getArgument(0);
            if (t.getId() == null) t.setId(801L);
            return t;
        });
    }

    @Test
    @DisplayName("1. Verify Opening Teller Cash Drawer with Vault Cash Allocation")
    void testOpenTellerDrawer() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(sourceBranch));
        when(userRepository.findById(10L)).thenReturn(Optional.of(cashier));
        when(drawerRepository.findByAssignedCashierIdAndStatus(10L, "OPEN")).thenReturn(Optional.empty());

        OpenDrawerRequest req = new OpenDrawerRequest();
        req.setBranchId(1L);
        req.setCashierUserId(10L);
        req.setDrawerCode("DRW-BLR-01");
        req.setInitialVaultCashAmount(new BigDecimal("500000.00"));

        TellerCashDrawerDto result = branchCashService.openTellerDrawer(req, branchManager);

        assertNotNull(result);
        assertEquals("DRW-BLR-01", result.getDrawerCode());
        assertEquals("OPEN", result.getStatus());
        assertEquals(new BigDecimal("500000.00"), result.getOpeningBalance());
        assertEquals(new BigDecimal("500000.00"), result.getCurrentBalance());

        // Vault cash should be deducted by initial amount (10M - 500k = 9.5M)
        assertEquals(new BigDecimal("9500000.00"), sourceBranch.getCashVaultBalance());
    }

    @Test
    @DisplayName("2. Verify Intraday Counter Deposits & Payments Update Cash Drawer Balances")
    void testTellerTransactionUpdatesTill() {
        TellerCashDrawer drawer = TellerCashDrawer.builder()
                .id(501L)
                .drawerCode("DRW-BLR-01")
                .branch(sourceBranch)
                .assignedCashier(cashier)
                .status("OPEN")
                .openingBalance(new BigDecimal("500000.00"))
                .cashReceipts(BigDecimal.ZERO)
                .cashPayments(BigDecimal.ZERO)
                .currentBalance(new BigDecimal("500000.00"))
                .build();

        when(drawerRepository.findByAssignedCashierIdAndStatus(10L, "OPEN")).thenReturn(Optional.of(drawer));

        // Cashier accepts ₹2,00,000 cash deposit
        branchCashService.recordTellerCashTransaction(cashier, new BigDecimal("200000.00"), true);
        assertEquals(new BigDecimal("200000.00"), drawer.getCashReceipts());
        assertEquals(new BigDecimal("700000.00"), drawer.getCurrentBalance());

        // Cashier pays out ₹1,00,000 cash withdrawal
        branchCashService.recordTellerCashTransaction(cashier, new BigDecimal("100000.00"), false);
        assertEquals(new BigDecimal("100000.00"), drawer.getCashPayments());
        assertEquals(new BigDecimal("600000.00"), drawer.getCurrentBalance());
    }

    @Test
    @DisplayName("3. Verify Teller Daily Handover & Vault Return with Zero Discrepancy")
    void testTellerHandoverExactMatch() {
        TellerCashDrawer drawer = TellerCashDrawer.builder()
                .id(501L)
                .drawerCode("DRW-BLR-01")
                .branch(sourceBranch)
                .assignedCashier(cashier)
                .status("OPEN")
                .openingBalance(new BigDecimal("500000.00"))
                .cashReceipts(new BigDecimal("200000.00"))
                .cashPayments(new BigDecimal("100000.00"))
                .currentBalance(new BigDecimal("600000.00"))
                .build();

        when(drawerRepository.findById(501L)).thenReturn(Optional.of(drawer));

        BigDecimal initialVault = sourceBranch.getCashVaultBalance(); // 10M

        TellerHandoverRequest req = new TellerHandoverRequest();
        req.setDrawerId(501L);
        req.setIsVaultReturn(true);
        req.setPhysicalCountAmount(new BigDecimal("600000.00")); // Exact match
        req.setHandoverRemarks("End of day cash drawer closed and returned to vault.");

        CashShortageExcessDto variance = branchCashService.executeTellerHandover(req, cashier);

        assertNull(variance, "No variance record should be created when physical count equals expected amount");
        assertEquals("CLOSED", drawer.getStatus());
        assertNotNull(drawer.getClosedAt());

        // Vault receives physical count (+600,000)
        assertEquals(initialVault.add(new BigDecimal("600000.00")), sourceBranch.getCashVaultBalance());
    }

    @Test
    @DisplayName("4. Verify Teller Shortage Incident Automatically Logged to Exception Audit")
    void testTellerHandoverShortageIncidentLogged() {
        TellerCashDrawer drawer = TellerCashDrawer.builder()
                .id(501L)
                .drawerCode("DRW-BLR-01")
                .branch(sourceBranch)
                .assignedCashier(cashier)
                .status("OPEN")
                .openingBalance(new BigDecimal("500000.00"))
                .cashReceipts(new BigDecimal("200000.00"))
                .cashPayments(new BigDecimal("100000.00"))
                .currentBalance(new BigDecimal("600000.00"))
                .build();

        when(drawerRepository.findById(501L)).thenReturn(Optional.of(drawer));

        TellerHandoverRequest req = new TellerHandoverRequest();
        req.setDrawerId(501L);
        req.setIsVaultReturn(true);
        req.setPhysicalCountAmount(new BigDecimal("595000.00")); // ₹5,000 SHORTAGE!
        req.setHandoverRemarks("Till count short by ₹5,000");

        CashShortageExcessDto variance = branchCashService.executeTellerHandover(req, cashier);

        assertNotNull(variance);
        assertEquals("SHORTAGE", variance.getIncidentType());
        assertEquals(new BigDecimal("600000.00"), variance.getExpectedAmount());
        assertEquals(new BigDecimal("595000.00"), variance.getPhysicalAmount());
        assertEquals(new BigDecimal("5000.00"), variance.getVarianceAmount());
        assertEquals("REPORTED", variance.getStatus());
    }

    @Test
    @DisplayName("5. Verify Inter-Branch Cash Transit Dispatch (Due-From) & Settlement (Due-To)")
    void testInterBranchCashTransferLifecycle() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(sourceBranch));
        when(branchRepository.findById(2L)).thenReturn(Optional.of(destBranch));

        BigDecimal transferAmount = new BigDecimal("2000000.00"); // ₹20 Lakhs

        // 1. Dispatch
        InterBranchTransferRequest req = new InterBranchTransferRequest();
        req.setSourceBranchId(1L);
        req.setDestinationBranchId(2L);
        req.setAmount(transferAmount);
        req.setTransitCarrier("Secure Armored Logistics Ltd");
        req.setSecuritySealNumber("SEAL-789123");
        req.setDispatchRemarks("Urgent liquidity rebalancing shipment");

        InterBranchTransferDto dispatched = branchCashService.initiateInterBranchTransfer(req, branchManager);

        assertNotNull(dispatched);
        assertEquals("DISPATCHED_IN_TRANSIT", dispatched.getStatus());
        assertEquals(transferAmount, dispatched.getAmount());
        assertEquals("Bangalore MG Road Central", dispatched.getSourceBranchName());
        assertEquals("Mumbai Fort Financial District", dispatched.getDestinationBranchName());

        // Source branch vault should be reduced by 2M (10M - 2M = 8M)
        assertEquals(new BigDecimal("8000000.00"), sourceBranch.getCashVaultBalance());

        // Verify Due-From Accounting Entry was posted: DR 1030-INTER-BRANCH-CLEARING / CR 1010-CASH-VAULT
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                eq(dispatched.getTransferNumber()), eq("INTER_BRANCH_CLEARING_DISPATCH"), eq(transferAmount),
                eq(sourceBranch), eq(branchManager), anyString()
        );

        // 2. Receive & Settle
        InterBranchCashTransfer inTransitEntity = InterBranchCashTransfer.builder()
                .id(801L)
                .transferNumber(dispatched.getTransferNumber())
                .sourceBranch(sourceBranch)
                .destinationBranch(destBranch)
                .amount(transferAmount)
                .status("DISPATCHED_IN_TRANSIT")
                .transitCarrier("Secure Armored Logistics Ltd")
                .securitySealNumber("SEAL-789123")
                .dispatchingOfficer(branchManager)
                .dispatchedAt(LocalDateTime.now())
                .build();

        when(interBranchTransferRepository.findById(801L)).thenReturn(Optional.of(inTransitEntity));

        User mumReceivingOfficer = User.builder().id(20L).username("bm_mumbai").branch(destBranch).build();

        InterBranchTransferDto settled = branchCashService.receiveAndSettleInterBranchTransfer(
                801L, "Armored vehicle arrived. Seals verified intact. Cash added to vault.", mumReceivingOfficer);

        assertNotNull(settled);
        assertEquals("RECEIVED_SETTLED", settled.getStatus());
        assertNotNull(settled.getReceivedAt());

        // Destination vault should increase by 2M (8M + 2M = 10M)
        assertEquals(new BigDecimal("10000000.00"), destBranch.getCashVaultBalance());

        // Verify Due-To Settlement Accounting Entry was posted: DR 1010-CASH-VAULT / CR 1030-INTER-BRANCH-CLEARING
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                eq(dispatched.getTransferNumber()), eq("INTER_BRANCH_CLEARING_SETTLEMENT"), eq(transferAmount),
                eq(destBranch), eq(mumReceivingOfficer), anyString()
        );
    }

    @Test
    @DisplayName("6. Verify Branch Comprehensive Cash Position Aggregation")
    void testBranchCashPositionAggregation() {
        TellerCashDrawer drawer1 = TellerCashDrawer.builder()
                .currentBalance(new BigDecimal("450000.00"))
                .cashReceipts(new BigDecimal("150000.00"))
                .cashPayments(new BigDecimal("50000.00"))
                .status("OPEN")
                .build();

        TellerCashDrawer drawer2 = TellerCashDrawer.builder()
                .currentBalance(new BigDecimal("350000.00"))
                .cashReceipts(new BigDecimal("100000.00"))
                .cashPayments(new BigDecimal("20000.00"))
                .status("OPEN")
                .build();

        when(branchRepository.findById(1L)).thenReturn(Optional.of(sourceBranch));
        when(drawerRepository.findByBranchIdAndStatus(1L, "OPEN")).thenReturn(List.of(drawer1, drawer2));
        when(interBranchTransferRepository.findByStatus("DISPATCHED_IN_TRANSIT")).thenReturn(Collections.emptyList());

        BranchCashPositionDto pos = branchCashService.getBranchCashPosition(1L);

        assertNotNull(pos);
        assertEquals("BLR-001", pos.getBranchCode());
        assertEquals(2, pos.getActiveDrawersCount());
        assertEquals(new BigDecimal("10000000.00"), pos.getVaultCashBalance());
        assertEquals(new BigDecimal("800000.00"), pos.getTotalDrawersCashBalance());
        assertEquals(new BigDecimal("10800000.00"), pos.getTotalBranchCash());
        assertEquals(new BigDecimal("250000.00"), pos.getTodayReceipts());
        assertEquals(new BigDecimal("70000.00"), pos.getTodayPayments());
        assertEquals(new BigDecimal("180000.00"), pos.getNetIntradayMovement());
    }
}
