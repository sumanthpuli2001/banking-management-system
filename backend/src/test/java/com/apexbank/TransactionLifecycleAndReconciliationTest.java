package com.apexbank;

import com.apexbank.dto.reconciliation.ReconciliationExceptionDto;
import com.apexbank.dto.reconciliation.ReconciliationReportDto;
import com.apexbank.dto.reconciliation.ReconciliationSummaryDto;
import com.apexbank.dto.transaction.FundTransferRequest;
import com.apexbank.dto.transaction.TransactionDto;
import com.apexbank.dto.transaction.TransactionLifecycleDto;
import com.apexbank.entity.*;
import com.apexbank.repository.*;
import com.apexbank.service.AuditService;
import com.apexbank.service.ReconciliationService;
import com.apexbank.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class TransactionLifecycleAndReconciliationTest {

    @Mock private ReconciliationReportRepository reportRepository;
    @Mock private ReconciliationExceptionRepository exceptionRepository;
    @Mock private GLAccountRepository glAccountRepository;
    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private JournalEntryRepository journalEntryRepository;
    @Mock private TransactionLedgerEntryRepository ledgerEntryRepository;
    @Mock private ApprovalRequestRepository approvalRequestRepository;
    @Mock private AuditService auditService;
    @Mock private com.apexbank.service.AccountingEngineService accountingEngineService;
    @Mock private TellerCashDrawerRepository tellerCashDrawerRepository;

    private ReconciliationService reconciliationService;
    private TransactionService transactionService;

    private User hoAdmin;
    private Branch mainBranch;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        reconciliationService = new ReconciliationService(
                reportRepository,
                exceptionRepository,
                glAccountRepository,
                bankAccountRepository,
                branchRepository,
                transactionRepository,
                journalEntryRepository,
                auditService
        );

        transactionService = new TransactionService(
                bankAccountRepository,
                transactionRepository,
                ledgerEntryRepository,
                approvalRequestRepository,
                auditService,
                accountingEngineService,
                tellerCashDrawerRepository
        );

        mainBranch = Branch.builder()
                .id(1L)
                .branchCode("BLR-001")
                .name("Bangalore MG Road Central")
                .cashVaultBalance(new BigDecimal("5000000.00"))
                .build();

        hoAdmin = User.builder()
                .id(1L)
                .username("ho_admin")
                .email("ho_admin@apexbank.com")
                .branch(mainBranch)
                .build();

        when(reportRepository.save(any(ReconciliationReport.class))).thenAnswer(i -> {
            ReconciliationReport r = i.getArgument(0);
            r.setId(101L);
            return r;
        });

        when(exceptionRepository.save(any(ReconciliationException.class))).thenAnswer(i -> {
            ReconciliationException e = i.getArgument(0);
            e.setId(201L);
            return e;
        });
    }

    @Test
    @DisplayName("1. Verify Transaction Lifecycle State Machine Allowed Transitions & Lock Enforcement")
    void testTransactionLifecycleStateTransitions() {
        Transaction txn = Transaction.builder()
                .referenceNumber("TXN-TEST-LIFECYCLE-001")
                .amount(new BigDecimal("15000.00"))
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .status(TransactionStatus.INITIATED)
                .accountingPostingStatus(AccountingPostingStatus.UNPOSTED)
                .externalPaymentStatus(ExternalPaymentStatus.INTERNAL)
                .build();

        // 1. INITIATED -> VALIDATING is allowed
        txn.transitionTo(TransactionStatus.VALIDATING);
        assertEquals(TransactionStatus.VALIDATING, txn.getStatus());

        // 2. VALIDATING -> PROCESSING is allowed
        txn.transitionTo(TransactionStatus.PROCESSING);
        assertEquals(TransactionStatus.PROCESSING, txn.getStatus());

        // 3. PROCESSING -> POSTED is allowed
        txn.transitionTo(TransactionStatus.POSTED);
        assertEquals(TransactionStatus.POSTED, txn.getStatus());

        // 4. POSTED -> SETTLED is allowed and sets settledAt
        txn.transitionTo(TransactionStatus.SETTLED);
        assertEquals(TransactionStatus.SETTLED, txn.getStatus());
        assertNotNull(txn.getSettledAt());

        // 5. SETTLED -> RECONCILED is allowed and sets reconciledAt
        txn.transitionTo(TransactionStatus.RECONCILED);
        assertEquals(TransactionStatus.RECONCILED, txn.getStatus());
        assertNotNull(txn.getReconciledAt());

        // 6. Prohibited transition: RECONCILED cannot jump to INITIATED or FAILED
        assertThrows(IllegalStateException.class, () -> txn.transitionTo(TransactionStatus.INITIATED));
    }

    @Test
    @DisplayName("2. Verify Separate Status Dimensions (Business, Accounting Posting, and Payment Rails)")
    void testSeparateStatusDimensions() {
        Transaction txn = Transaction.builder()
                .referenceNumber("TXN-DIM-001")
                .amount(new BigDecimal("250000.00"))
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .status(TransactionStatus.SETTLED)
                .accountingPostingStatus(AccountingPostingStatus.POSTED_BALANCED)
                .externalPaymentStatus(ExternalPaymentStatus.INTERNAL)
                .build();

        assertEquals(TransactionStatus.SETTLED, txn.getStatus());
        assertEquals(AccountingPostingStatus.POSTED_BALANCED, txn.getAccountingPostingStatus());
        assertEquals(ExternalPaymentStatus.INTERNAL, txn.getExternalPaymentStatus());

        TransactionDto dto = transactionService.mapToDto(txn);
        assertNotNull(dto);
        assertEquals(TransactionStatus.SETTLED, dto.getStatus());
        assertEquals(AccountingPostingStatus.POSTED_BALANCED, dto.getAccountingPostingStatus());
        assertEquals(ExternalPaymentStatus.INTERNAL, dto.getExternalPaymentStatus());
    }

    @Test
    @DisplayName("3. Verify Idempotency Protection Returns Cached Transaction Without Duplicate Debit")
    void testIdempotencyProtection() {
        String idempotencyKey = "IDEMP-KEY-TEST-999";
        Transaction existingTxn = Transaction.builder()
                .id(99L)
                .referenceNumber("TXN-TRF-EXISTING-99")
                .idempotencyKey(idempotencyKey)
                .amount(new BigDecimal("1000.00"))
                .status(TransactionStatus.SETTLED)
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .build();

        when(transactionRepository.findByIdempotencyKey(idempotencyKey)).thenReturn(Optional.of(existingTxn));

        FundTransferRequest request = new FundTransferRequest();
        request.setSourceAccountNumber("ACC-1001");
        request.setDestinationAccountNumber("ACC-1002");
        request.setAmount(new BigDecimal("1000.00"));
        request.setIdempotencyKey(idempotencyKey);

        TransactionDto result = transactionService.processFundTransfer(request, hoAdmin);

        assertNotNull(result);
        assertEquals(99L, result.getId());
        assertEquals("TXN-TRF-EXISTING-99", result.getReferenceNumber());
        assertEquals(idempotencyKey, result.getIdempotencyKey());

        // Verify no account update or new transaction save was executed!
        verify(bankAccountRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. Verify 5-Point Institutional Reconciliation Cycle Execution")
    void testReconciliationCycleExecution() {
        when(branchRepository.findAll()).thenReturn(List.of(mainBranch));

        GLAccount vaultGL = GLAccount.builder()
                .accountCode("1010-CASH-VAULT")
                .currentBalance(new BigDecimal("5000000.00"))
                .build();
        when(glAccountRepository.findByAccountCode("1010-CASH-VAULT")).thenReturn(Optional.of(vaultGL));

        BankAccount account1 = BankAccount.builder().balance(new BigDecimal("2000000.00")).build();
        BankAccount account2 = BankAccount.builder().balance(new BigDecimal("3000000.00")).build();
        when(bankAccountRepository.findAll()).thenReturn(List.of(account1, account2));

        GLAccount savingsGL = GLAccount.builder()
                .accountCode("2010-DEMAND-DEPOSITS-SAVINGS")
                .currentBalance(new BigDecimal("3000000.00"))
                .build();
        GLAccount currentGL = GLAccount.builder()
                .accountCode("2020-DEMAND-DEPOSITS-CURRENT")
                .currentBalance(new BigDecimal("2000000.00"))
                .build();
        when(glAccountRepository.findByAccountCode("2010-DEMAND-DEPOSITS-SAVINGS")).thenReturn(Optional.of(savingsGL));
        when(glAccountRepository.findByAccountCode("2020-DEMAND-DEPOSITS-CURRENT")).thenReturn(Optional.of(currentGL));

        when(transactionRepository.findFilteredTransactions(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        List<ReconciliationReportDto> reports = reconciliationService.runComprehensiveReconciliation(hoAdmin);

        assertNotNull(reports);
        assertEquals(5, reports.size());

        // Check Branch Cash vs Ledger: Expected 5M, Actual 5M -> 0 discrepancy
        ReconciliationReportDto cashReport = reports.stream()
                .filter(r -> r.getReconciliationType() == ReconciliationType.BRANCH_CASH_VS_LEDGER)
                .findFirst().orElseThrow();
        assertEquals("BALANCED", cashReport.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(cashReport.getDiscrepancyAmount()));

        // Check Customer Accounts vs Ledger: Expected 5M, Actual 5M -> 0 discrepancy
        ReconciliationReportDto custReport = reports.stream()
                .filter(r -> r.getReconciliationType() == ReconciliationType.CUSTOMER_ACCOUNTS_VS_LEDGER)
                .findFirst().orElseThrow();
        assertEquals("BALANCED", custReport.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(custReport.getDiscrepancyAmount()));
    }

    @Test
    @DisplayName("5. Verify Reconciliation Exception Queue Creation & Resolution")
    void testReconciliationExceptionResolution() {
        ReconciliationException ex = ReconciliationException.builder()
                .id(77L)
                .exceptionNumber("REC-EX-20261115-077")
                .reconciliationType(ReconciliationType.BRANCH_CASH_VS_LEDGER)
                .entityType("BRANCH_VAULT")
                .entityIdentifier("BLR-001")
                .expectedAmount(new BigDecimal("5000000.00"))
                .actualAmount(new BigDecimal("4950000.00"))
                .discrepancyAmount(new BigDecimal("50000.00"))
                .status("OPEN")
                .detectedAt(LocalDateTime.now())
                .build();

        when(exceptionRepository.findById(77L)).thenReturn(Optional.of(ex));
        when(exceptionRepository.save(any(ReconciliationException.class))).thenAnswer(i -> i.getArgument(0));

        ReconciliationExceptionDto resolved = reconciliationService.resolveException(
                77L, "Atm replenishment discrepancy reconciled with armored carrier receipt.", hoAdmin);

        assertNotNull(resolved);
        assertEquals("RESOLVED", resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());
        assertEquals("ho_admin", resolved.getResolvedByUsername());
        assertEquals("Atm replenishment discrepancy reconciled with armored carrier receipt.", resolved.getResolutionNotes());
    }

    @Test
    @DisplayName("6. Verify Full Transaction Lifecycle Inspection Timeline")
    void testTransactionLifecycleInspection() {
        Transaction txn = Transaction.builder()
                .id(88L)
                .referenceNumber("TXN-TRF-20261115-88")
                .amount(new BigDecimal("75000.00"))
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .status(TransactionStatus.SETTLED)
                .accountingPostingStatus(AccountingPostingStatus.POSTED_BALANCED)
                .externalPaymentStatus(ExternalPaymentStatus.INTERNAL)
                .paymentChannel("INTERNET_BANKING")
                .transactionTimestamp(LocalDateTime.now())
                .settledAt(LocalDateTime.now().plusNanos(500_000_000))
                .build();

        when(transactionRepository.findById(88L)).thenReturn(Optional.of(txn));

        TransactionLifecycleDto lifecycle = transactionService.getTransactionLifecycle(88L);

        assertNotNull(lifecycle);
        assertEquals("TXN-TRF-20261115-88", lifecycle.getReferenceNumber());
        assertEquals(TransactionStatus.SETTLED, lifecycle.getCurrentStatus());
        assertEquals(AccountingPostingStatus.POSTED_BALANCED, lifecycle.getAccountingPostingStatus());
        assertEquals(ExternalPaymentStatus.INTERNAL, lifecycle.getExternalPaymentStatus());

        List<TransactionLifecycleDto.LifecycleStepDto> steps = lifecycle.getLifecycleSteps();
        assertNotNull(steps);
        assertEquals(6, steps.size());

        assertEquals("INITIATION", steps.get(0).getStage());
        assertEquals("COMPLETED", steps.get(0).getStatus());

        assertEquals("VALIDATION", steps.get(1).getStage());
        assertEquals("COMPLETED", steps.get(1).getStatus());

        assertEquals("AUTHORIZATION", steps.get(2).getStage());
        assertEquals("COMPLETED", steps.get(2).getStatus());

        assertEquals("GL_POSTING", steps.get(3).getStage());
        assertEquals("COMPLETED", steps.get(3).getStatus());

        assertEquals("SETTLEMENT", steps.get(4).getStage());
        assertEquals("COMPLETED", steps.get(4).getStatus());

        assertEquals("RECONCILIATION", steps.get(5).getStage());
        assertEquals("PENDING_DAILY_CYCLE", steps.get(5).getStatus());
    }
}
