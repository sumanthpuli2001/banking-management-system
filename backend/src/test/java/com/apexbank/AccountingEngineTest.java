package com.apexbank;

import com.apexbank.dto.accounting.*;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.repository.*;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class AccountingEngineTest {

    @Mock private GLAccountRepository glAccountRepository;
    @Mock private JournalEntryRepository journalEntryRepository;
    @Mock private JournalEntryLineRepository journalEntryLineRepository;
    @Mock private AccountingPeriodRepository accountingPeriodRepository;
    @Mock private DailyClosingRepository dailyClosingRepository;
    @Mock private AccountingRuleMappingRepository ruleMappingRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private AuditService auditService;

    private AccountingEngineService accountingEngineService;

    private GLAccount cashVaultAccount;
    private GLAccount savingsDepositAccount;
    private Branch mockBranch;
    private User mockUser;
    private AccountingRuleMapping depositRule;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        accountingEngineService = new AccountingEngineService(
                glAccountRepository,
                journalEntryRepository,
                journalEntryLineRepository,
                accountingPeriodRepository,
                dailyClosingRepository,
                ruleMappingRepository,
                branchRepository,
                auditService
        );

        mockBranch = Branch.builder()
                .id(1L)
                .branchCode("HO-001")
                .name("Apex Central Head Office")
                .cashVaultBalance(new BigDecimal("5000000.0000"))
                .build();

        mockUser = User.builder()
                .id(101L)
                .username("ho_admin")
                .fullName("Executive Administrator")
                .branch(mockBranch)
                .build();

        cashVaultAccount = GLAccount.builder()
                .id(1L)
                .accountCode("1010-CASH-VAULT")
                .accountName("Branch Cash Vault & Counter Currency")
                .classification(AccountClassification.ASSET)
                .normalBalance("DEBIT")
                .currentBalance(new BigDecimal("5000000.0000"))
                .branch(mockBranch)
                .build();

        savingsDepositAccount = GLAccount.builder()
                .id(2L)
                .accountCode("2010-DEMAND-DEPOSITS-SAVINGS")
                .accountName("Customer Savings Account Deposits")
                .classification(AccountClassification.LIABILITY)
                .normalBalance("CREDIT")
                .currentBalance(new BigDecimal("10000000.0000"))
                .branch(mockBranch)
                .build();

        depositRule = AccountingRuleMapping.builder()
                .id(1L)
                .eventCode("CASH_DEPOSIT")
                .debitAccountCode("1010-CASH-VAULT")
                .creditAccountCode("2010-DEMAND-DEPOSITS-SAVINGS")
                .description("Cash received at counter credited to customer liability")
                .isActive(true)
                .build();

        when(ruleMappingRepository.findByEventCodeAndIsActiveTrue("CASH_DEPOSIT"))
                .thenReturn(Optional.of(depositRule));
        when(glAccountRepository.findByAccountCodeForUpdate("1010-CASH-VAULT"))
                .thenReturn(Optional.of(cashVaultAccount));
        when(glAccountRepository.findByAccountCodeForUpdate("2010-DEMAND-DEPOSITS-SAVINGS"))
                .thenReturn(Optional.of(savingsDepositAccount));
        when(glAccountRepository.findByAccountCode("1010-CASH-VAULT"))
                .thenReturn(Optional.of(cashVaultAccount));

        when(accountingPeriodRepository.findActivePeriodForDate(any(LocalDate.class)))
                .thenReturn(Optional.of(AccountingPeriod.builder()
                        .id(1L)
                        .periodName("PERIOD-202611")
                        .status("OPEN")
                        .build()));

        when(journalEntryRepository.save(any(JournalEntry.class)))
                .thenAnswer(invocation -> {
                    JournalEntry je = invocation.getArgument(0);
                    je.setId(1001L);
                    return je;
                });
    }

    @Test
    @DisplayName("Test 1: Balanced Cash Deposit Journal Entry (DR Cash / CR Savings Liability)")
    public void testBalancedJournalEntryPostSuccess() {
        BigDecimal depositAmount = new BigDecimal("50000.0000");

        JournalEntryDto result = accountingEngineService.postTransactionAccountingEntry(
                "TXN-DEP-1001",
                "CASH_DEPOSIT",
                depositAmount,
                mockBranch,
                mockUser,
                "Customer counter deposit"
        );

        assertNotNull(result);
        assertEquals("POSTED", result.getStatus());
        assertEquals(0, depositAmount.compareTo(result.getTotalDebit()));
        assertEquals(0, depositAmount.compareTo(result.getTotalCredit()));
        assertEquals(2, result.getLines().size());

        // Asset (Cash): DR increases balance from 5,000,000 to 5,050,000
        assertEquals(0, new BigDecimal("5050000.0000").compareTo(cashVaultAccount.getCurrentBalance()));

        // Liability (Savings): CR increases balance from 10,000,000 to 10,050,000
        assertEquals(0, new BigDecimal("10050000.0000").compareTo(savingsDepositAccount.getCurrentBalance()));

        verify(journalEntryRepository, times(1)).save(any(JournalEntry.class));
        verify(glAccountRepository, times(1)).save(cashVaultAccount);
        verify(glAccountRepository, times(1)).save(savingsDepositAccount);
    }

    @Test
    @DisplayName("Test 2: Zero or Negative Amount is Rejected by Accounting Engine")
    public void testZeroAmountRejected() {
        assertThrows(BankingException.class, () ->
                accountingEngineService.postTransactionAccountingEntry(
                        "TXN-DEP-FAIL",
                        "CASH_DEPOSIT",
                        BigDecimal.ZERO,
                        mockBranch,
                        mockUser,
                        "Invalid zero amount"
                )
        );
    }

    @Test
    @DisplayName("Test 3: Immutable Reversal Generates Mirror Inverse Voucher and Restores GL Balances")
    public void testReversalCreatesExactMirrorInverse() {
        // Prepare original posted journal entry
        JournalEntry original = JournalEntry.builder()
                .id(501L)
                .entryNumber("JE-20261115-11111")
                .postingDate(LocalDate.now())
                .transactionReference("TXN-DEP-1001")
                .totalDebit(new BigDecimal("50000.0000"))
                .totalCredit(new BigDecimal("50000.0000"))
                .status("POSTED")
                .branch(mockBranch)
                .build();

        JournalEntryLine drLine = JournalEntryLine.builder()
                .id(1L)
                .journalEntry(original)
                .glAccount(cashVaultAccount)
                .entryType("DEBIT")
                .amount(new BigDecimal("50000.0000"))
                .lineNumber(1)
                .build();

        JournalEntryLine crLine = JournalEntryLine.builder()
                .id(2L)
                .journalEntry(original)
                .glAccount(savingsDepositAccount)
                .entryType("CREDIT")
                .amount(new BigDecimal("50000.0000"))
                .lineNumber(2)
                .build();

        original.addLine(drLine);
        original.addLine(crLine);

        // Pre-apply deposit so balance is currently 5,050,000 and 10,050,000
        cashVaultAccount.setCurrentBalance(new BigDecimal("5050000.0000"));
        savingsDepositAccount.setCurrentBalance(new BigDecimal("10050000.0000"));

        when(journalEntryRepository.findById(501L)).thenReturn(Optional.of(original));

        JournalReversalRequest reversalReq = new JournalReversalRequest("Authorized procedural correction");
        JournalEntryDto reversal = accountingEngineService.reverseJournalEntry(501L, reversalReq, mockUser);

        assertNotNull(reversal);
        assertTrue(reversal.getEntryNumber().startsWith("REV-"));
        assertEquals("POSTED", reversal.getStatus());

        // Verify original status is now REVERSED
        assertEquals("REVERSED", original.getStatus());
        assertEquals("Authorized procedural correction", original.getReversalReason());

        // Verify GL accounts were restored to original 5,000,000 and 10,000,000
        assertEquals(0, new BigDecimal("5000000.0000").compareTo(cashVaultAccount.getCurrentBalance()));
        assertEquals(0, new BigDecimal("10000000.0000").compareTo(savingsDepositAccount.getCurrentBalance()));
    }

    @Test
    @DisplayName("Test 4: Institutional Trial Balance Verification (Total Debits == Total Credits)")
    public void testTrialBalanceDebitsEqualCredits() {
        // Setup a set of balanced GL accounts:
        // Assets: 15,000,000
        // Liabilities: 12,000,000
        // Equity: 3,000,000
        // Total DR = 15,000,000, Total CR = 15,000,000 -> Diff = 0.00
        GLAccount loansAsset = GLAccount.builder()
                .id(3L)
                .accountCode("1020-LOANS-ADVANCES")
                .accountName("Loan Portfolio")
                .classification(AccountClassification.ASSET)
                .normalBalance("DEBIT")
                .currentBalance(new BigDecimal("10000000.0000"))
                .build();

        GLAccount equityCapital = GLAccount.builder()
                .id(4L)
                .accountCode("3010-SHARE-CAPITAL")
                .accountName("Equity Capital")
                .classification(AccountClassification.EQUITY)
                .normalBalance("CREDIT")
                .currentBalance(new BigDecimal("3000000.0000"))
                .build();

        cashVaultAccount.setCurrentBalance(new BigDecimal("5000000.0000"));
        savingsDepositAccount.setCurrentBalance(new BigDecimal("12000000.0000"));

        when(glAccountRepository.findAll()).thenReturn(List.of(
                cashVaultAccount, loansAsset, savingsDepositAccount, equityCapital
        ));

        TrialBalanceDto tb = accountingEngineService.generateTrialBalance(null, LocalDate.now());

        assertNotNull(tb);
        assertEquals(0, new BigDecimal("15000000.0000").compareTo(tb.getTotalDebits()));
        assertEquals(0, new BigDecimal("15000000.0000").compareTo(tb.getTotalCredits()));
        assertEquals(0, BigDecimal.ZERO.compareTo(tb.getDifference()));
        assertTrue(tb.getIsBalanced());
        assertEquals(4, tb.getItems().size());
    }

    @Test
    @DisplayName("Test 5: Daily Cash Closing Calculates Discrepancies Accurately")
    public void testDailyCashClosingCalculation() {
        when(branchRepository.findById(1L)).thenReturn(Optional.of(mockBranch));

        // Opening cash in branch vault: 5,000,000
        // Simulate today's lines: Debit cash 200,000 (receipts), Credit cash 100,000 (payments)
        // Expected closing: 5,000,000 + 200,000 - 100,000 = 5,100,000
        // Teller counted: 5,100,000 -> BALANCED
        JournalEntryLine receiptLine = JournalEntryLine.builder()
                .glAccount(cashVaultAccount)
                .entryType("DEBIT")
                .amount(new BigDecimal("200000.0000"))
                .build();

        JournalEntryLine payoutLine = JournalEntryLine.builder()
                .glAccount(cashVaultAccount)
                .entryType("CREDIT")
                .amount(new BigDecimal("100000.0000"))
                .build();

        when(journalEntryLineRepository.findByAccountCodeAndDateRange(
                eq("1010-CASH-VAULT"), any(LocalDate.class), any(LocalDate.class), any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(receiptLine, payoutLine)));

        when(dailyClosingRepository.save(any(DailyClosing.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DailyClosingRequest request = DailyClosingRequest.builder()
                .branchId(1L)
                .closingDate(LocalDate.now())
                .physicalCashCounted(new BigDecimal("5100000.0000"))
                .notes("All branch counters balanced")
                .build();

        DailyClosingDto closing = accountingEngineService.performDailyClosing(request, mockUser, mockUser);

        assertNotNull(closing);
        assertEquals(0, new BigDecimal("5000000.0000").compareTo(closing.getOpeningCash()));
        assertEquals(0, new BigDecimal("200000.0000").compareTo(closing.getTotalCashReceipts()));
        assertEquals(0, new BigDecimal("100000.0000").compareTo(closing.getTotalCashPayments()));
        assertEquals(0, new BigDecimal("5100000.0000").compareTo(closing.getExpectedClosingCash()));
        assertEquals(0, new BigDecimal("5100000.0000").compareTo(closing.getPhysicalCashCounted()));
        assertEquals(0, BigDecimal.ZERO.compareTo(closing.getDiscrepancy()));
        assertEquals("BALANCED", closing.getStatus());
    }
}
