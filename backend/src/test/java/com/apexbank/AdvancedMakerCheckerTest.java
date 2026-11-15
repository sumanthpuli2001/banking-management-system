package com.apexbank;

import com.apexbank.dto.approval.*;
import com.apexbank.entity.*;
import com.apexbank.entity.approval.ApprovalMatrixRule;
import com.apexbank.exception.BankingException;
import com.apexbank.repository.*;
import com.apexbank.repository.approval.ApprovalAuditLogRepository;
import com.apexbank.repository.approval.ApprovalMatrixRuleRepository;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.ApprovalService;
import com.apexbank.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdvancedMakerCheckerTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;

    @Mock
    private ApprovalMatrixRuleRepository matrixRuleRepository;

    @Mock
    private ApprovalAuditLogRepository auditLogRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private TransactionLedgerEntryRepository ledgerEntryRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private AccountingEngineService accountingEngineService;

    private ApprovalService approvalService;

    private User makerUser;
    private User checkerUser;
    private User regionalManagerUser;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        approvalService = new ApprovalService(
                approvalRequestRepository,
                matrixRuleRepository,
                auditLogRepository,
                transactionRepository,
                bankAccountRepository,
                ledgerEntryRepository,
                auditService,
                accountingEngineService
        );

        testBranch = Branch.builder()
                .id(1L)
                .branchCode("CORP001")
                .name("Corporate Finance Branch")
                .build();

        Role employeeRole = Role.builder().id(1L).name(RoleType.BANK_EMPLOYEE).build();
        Role branchManagerRole = Role.builder().id(2L).name(RoleType.BRANCH_MANAGER).build();
        Role regionalManagerRole = Role.builder().id(3L).name(RoleType.REGIONAL_MANAGER).build();

        makerUser = User.builder()
                .id(101L)
                .username("maker.teller")
                .fullName("Rajesh Sharma")
                .email("rajesh@apexbank.com")
                .roles(new HashSet<>(Collections.singletonList(employeeRole)))
                .branch(testBranch)
                .build();

        checkerUser = User.builder()
                .id(102L)
                .username("checker.manager")
                .fullName("Anita Verma")
                .email("anita@apexbank.com")
                .roles(new HashSet<>(Collections.singletonList(branchManagerRole)))
                .branch(testBranch)
                .build();

        regionalManagerUser = User.builder()
                .id(103L)
                .username("checker.regional")
                .fullName("Vikram Malhotra")
                .email("vikram@apexbank.com")
                .roles(new HashSet<>(Collections.singletonList(regionalManagerRole)))
                .branch(testBranch)
                .build();
    }

    @Test
    @DisplayName("Dual-Control Enforcement: Maker cannot approve their own request")
    void testSelfApprovalPrevention() {
        ApprovalRequest pendingReq = ApprovalRequest.builder()
                .id(501L)
                .requestType("HIGH_VALUE_TRANSFER")
                .ruleCode("RULE_TXN_TIER1")
                .requiredRole("BRANCH_MANAGER")
                .maker(makerUser)
                .amount(new BigDecimal("100000.00"))
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(approvalRequestRepository.findById(501L)).thenReturn(Optional.of(pendingReq));

        ApprovalDecisionRequest decision = ApprovalDecisionRequest.builder()
                .decision("APPROVED")
                .checkerRemarks("Self-approving my own submission")
                .build();

        // Maker attempts to approve their own request -> Must throw BankingException
        BankingException ex = assertThrows(BankingException.class, () ->
                approvalService.processDecision(501L, decision, makerUser));

        assertTrue(ex.getMessage().contains("Dual-authorization violation"));
        verify(approvalRequestRepository, never()).save(any(ApprovalRequest.class));
    }

    @Test
    @DisplayName("Approval Matrix Evaluation: Correct rule and tier matching by transaction amount")
    void testApprovalMatrixEvaluationByAmount() {
        ApprovalMatrixRule tier1 = ApprovalMatrixRule.builder()
                .ruleCode("RULE_TXN_TIER1")
                .operationType("HIGH_VALUE_TRANSFER")
                .minAmount(new BigDecimal("50000.00"))
                .maxAmount(new BigDecimal("500000.00"))
                .requiredCheckerRole("BRANCH_MANAGER")
                .riskCategory("MEDIUM")
                .expiryHours(24)
                .build();

        when(matrixRuleRepository.findMatchingRules(eq("HIGH_VALUE_TRANSFER"), eq(new BigDecimal("200000.00"))))
                .thenReturn(List.of(tier1));

        when(approvalRequestRepository.save(any(ApprovalRequest.class))).thenAnswer(invocation -> {
            ApprovalRequest req = invocation.getArgument(0);
            req.setId(777L);
            return req;
        });

        ApprovalRequestDto dto = approvalService.submitApprovalRequest(
                "HIGH_VALUE_TRANSFER", "Transaction", 999L, new BigDecimal("200000.00"),
                makerUser, testBranch, "Commercial vendor payment", "{}"
        );

        assertNotNull(dto);
        assertEquals("RULE_TXN_TIER1", dto.getRuleCode());
        assertEquals("BRANCH_MANAGER", dto.getRequiredRole());
        assertEquals("MEDIUM", dto.getRiskLevel());
        assertEquals("PENDING", dto.getStatus());
        assertNotNull(dto.getExpiresAt());
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Role Clearance Enforcement: Insufficient checker clearance is rejected")
    void testInsufficientRoleClearanceRejection() {
        ApprovalRequest tier2Req = ApprovalRequest.builder()
                .id(502L)
                .requestType("HIGH_VALUE_TRANSFER")
                .ruleCode("RULE_TXN_TIER2")
                .requiredRole("REGIONAL_MANAGER") // Requires Regional Manager
                .maker(makerUser)
                .amount(new BigDecimal("2500000.00"))
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(approvalRequestRepository.findById(502L)).thenReturn(Optional.of(tier2Req));

        ApprovalDecisionRequest decision = ApprovalDecisionRequest.builder()
                .decision("APPROVED")
                .checkerRemarks("Attempting approval with only Branch Manager clearance")
                .build();

        // Anita has only BRANCH_MANAGER clearance -> must fail
        BankingException ex = assertThrows(BankingException.class, () ->
                approvalService.processDecision(502L, decision, checkerUser));

        assertTrue(ex.getMessage().contains("Insufficient authorization authority"));
    }

    @Test
    @DisplayName("Full Workflow: Approved high-value transfer executes balances, ledgers, and Core GL entry")
    void testApprovedHighValueTransferExecutionAndAccountingPost() {
        BankAccount srcAcc = BankAccount.builder()
                .id(11L)
                .accountNumber("ACC-SRC-101")
                .balance(new BigDecimal("500000.00"))
                .availableBalance(new BigDecimal("500000.00"))
                .branch(testBranch)
                .build();

        BankAccount destAcc = BankAccount.builder()
                .id(12L)
                .accountNumber("ACC-DST-202")
                .balance(new BigDecimal("50000.00"))
                .availableBalance(new BigDecimal("50000.00"))
                .branch(testBranch)
                .build();

        Transaction txn = Transaction.builder()
                .id(888L)
                .referenceNumber("TXN-REF-888")
                .sourceAccount(srcAcc)
                .destinationAccount(destAcc)
                .amount(new BigDecimal("150000.00"))
                .status(TransactionStatus.PENDING_APPROVAL)
                .build();

        ApprovalRequest approvalReq = ApprovalRequest.builder()
                .id(601L)
                .requestType("HIGH_VALUE_TRANSFER")
                .ruleCode("RULE_TXN_TIER1")
                .requiredRole("BRANCH_MANAGER")
                .maker(makerUser)
                .amount(new BigDecimal("150000.00"))
                .targetEntityName("Transaction")
                .targetEntityId(888L)
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(approvalRequestRepository.findById(601L)).thenReturn(Optional.of(approvalReq));
        when(approvalRequestRepository.save(any(ApprovalRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findById(888L)).thenReturn(Optional.of(txn));

        ApprovalDecisionRequest decision = ApprovalDecisionRequest.builder()
                .decision("APPROVED")
                .checkerRemarks("Approved after beneficiary verification")
                .build();

        ApprovalRequestDto result = approvalService.processDecision(601L, decision, checkerUser);

        assertEquals("APPROVED", result.getStatus());
        assertEquals(TransactionStatus.SUCCESS, txn.getStatus());
        assertEquals(new BigDecimal("350000.00"), srcAcc.getBalance());
        assertEquals(new BigDecimal("200000.00"), destAcc.getBalance());

        // Verify account-level ledgers saved
        verify(ledgerEntryRepository, times(2)).save(any());

        // Verify Core General Ledger posting triggered
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                eq("TXN-REF-888"), eq("INTERNAL_TRANSFER"), eq(new BigDecimal("150000.00")),
                eq(testBranch), eq(checkerUser), anyString()
        );
    }

    @Test
    @DisplayName("Rejection Control: Rejection requires reason and updates transaction status to FAILED")
    void testRejectionRequiresMandatoryReason() {
        Transaction txn = Transaction.builder()
                .id(889L)
                .referenceNumber("TXN-REF-889")
                .status(TransactionStatus.PENDING_APPROVAL)
                .build();

        ApprovalRequest approvalReq = ApprovalRequest.builder()
                .id(602L)
                .requestType("HIGH_VALUE_TRANSFER")
                .ruleCode("RULE_TXN_TIER1")
                .requiredRole("BRANCH_MANAGER")
                .maker(makerUser)
                .amount(new BigDecimal("80000.00"))
                .targetEntityName("Transaction")
                .targetEntityId(889L)
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(approvalRequestRepository.findById(602L)).thenReturn(Optional.of(approvalReq));

        // Attempt rejection without any remarks or reason -> Should throw
        ApprovalDecisionRequest emptyReasonReq = ApprovalDecisionRequest.builder()
                .decision("REJECTED")
                .checkerRemarks("   ")
                .rejectionReason(null)
                .build();

        BankingException ex = assertThrows(BankingException.class, () ->
                approvalService.processDecision(602L, emptyReasonReq, checkerUser));
        assertTrue(ex.getMessage().contains("mandatory rejection reason"));

        // Valid rejection with explicit reason
        when(approvalRequestRepository.save(any(ApprovalRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findById(889L)).thenReturn(Optional.of(txn));

        ApprovalDecisionRequest validRejection = ApprovalDecisionRequest.builder()
                .decision("REJECTED")
                .rejectionReason("Suspected fraud / KYC mismatch on beneficiary account")
                .checkerRemarks("Declined following telephonic callback verification")
                .build();

        ApprovalRequestDto rejectedDto = approvalService.processDecision(602L, validRejection, checkerUser);

        assertEquals("REJECTED", rejectedDto.getStatus());
        assertEquals("Suspected fraud / KYC mismatch on beneficiary account", rejectedDto.getRejectionReason());
        assertEquals(TransactionStatus.FAILED, txn.getStatus());
        assertTrue(txn.getFailureReason().contains("Rejected by Checker"));
    }

    @Test
    @DisplayName("SLA Expiry Sweep & Escalation: Automated expiry marking and tiered role escalation")
    void testSlaExpirySweepAndEscalationWorkflow() {
        // Test 1: Escalation
        ApprovalRequest pendingReq = ApprovalRequest.builder()
                .id(701L)
                .requestType("HIGH_VALUE_TRANSFER")
                .ruleCode("RULE_TXN_TIER1")
                .requiredRole("BRANCH_MANAGER")
                .maker(makerUser)
                .amount(new BigDecimal("150000.00"))
                .status("PENDING")
                .isEscalated(false)
                .requestedAt(LocalDateTime.now().minusHours(14))
                .build();

        when(approvalRequestRepository.findById(701L)).thenReturn(Optional.of(pendingReq));
        when(approvalRequestRepository.save(any(ApprovalRequest.class))).thenAnswer(i -> i.getArgument(0));

        ApprovalRequestDto escalatedDto = approvalService.escalatePendingRequest(
                701L, "SLA turnaround breach (> 12 hours pending)", checkerUser
        );

        assertTrue(escalatedDto.getIsEscalated());
        assertEquals("REGIONAL_MANAGER", escalatedDto.getRequiredRole());
        assertEquals("REGIONAL_MANAGER", escalatedDto.getEscalatedToRole());
        assertNotNull(escalatedDto.getEscalatedAt());

        // Test 2: SLA Expiry Sweep
        ApprovalRequest overdueReq = ApprovalRequest.builder()
                .id(702L)
                .requestType("HIGH_VALUE_TRANSFER")
                .status("PENDING")
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .build();

        when(approvalRequestRepository.findExpiredPendingRequests(any())).thenReturn(List.of(overdueReq));

        int expiredCount = approvalService.sweepExpiredRequests();
        assertEquals(1, expiredCount);
        assertEquals("EXPIRED", overdueReq.getStatus());
        verify(auditLogRepository, atLeastOnce()).save(any());
    }
}
