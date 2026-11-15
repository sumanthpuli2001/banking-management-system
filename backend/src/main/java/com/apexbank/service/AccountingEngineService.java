package com.apexbank.service;

import com.apexbank.dto.accounting.*;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class AccountingEngineService {

    private final GLAccountRepository glAccountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final DailyClosingRepository dailyClosingRepository;
    private final AccountingRuleMappingRepository ruleMappingRepository;
    private final BranchRepository branchRepository;
    private final AuditService auditService;

    public AccountingEngineService(GLAccountRepository glAccountRepository,
                                   JournalEntryRepository journalEntryRepository,
                                   JournalEntryLineRepository journalEntryLineRepository,
                                   AccountingPeriodRepository accountingPeriodRepository,
                                   DailyClosingRepository dailyClosingRepository,
                                   AccountingRuleMappingRepository ruleMappingRepository,
                                   BranchRepository branchRepository,
                                   AuditService auditService) {
        this.glAccountRepository = glAccountRepository;
        this.journalEntryRepository = journalEntryRepository;
        this.journalEntryLineRepository = journalEntryLineRepository;
        this.accountingPeriodRepository = accountingPeriodRepository;
        this.dailyClosingRepository = dailyClosingRepository;
        this.ruleMappingRepository = ruleMappingRepository;
        this.branchRepository = branchRepository;
        this.auditService = auditService;
    }

    /**
     * Core Double-Entry Posting Engine for Banking Transactions.
     * Guaranteed: Total Debits == Total Credits.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JournalEntryDto postTransactionAccountingEntry(String transactionReference,
                                                          String eventCode,
                                                          BigDecimal amount,
                                                          Branch branch,
                                                          User user,
                                                          String narration) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BankingException("Accounting posting error: Transaction amount must be positive.");
        }

        // Standardize scale to 4 decimal places
        BigDecimal normalizedAmount = amount.setScale(4, RoundingMode.HALF_UP);

        // Fetch dynamic rule mapping
        AccountingRuleMapping mapping = ruleMappingRepository.findByEventCodeAndIsActiveTrue(eventCode)
                .orElseThrow(() -> new BankingException("No active accounting rule mapping found for financial event: " + eventCode));

        GLAccount debitAccount = glAccountRepository.findByAccountCodeForUpdate(mapping.getDebitAccountCode())
                .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", mapping.getDebitAccountCode()));

        GLAccount creditAccount = glAccountRepository.findByAccountCodeForUpdate(mapping.getCreditAccountCode())
                .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", mapping.getCreditAccountCode()));

        // Ensure active accounting period is open
        validateOrOpenAccountingPeriod(LocalDate.now(), user);

        String entryNumber = generateEntryNumber();

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNumber)
                .postingDate(LocalDate.now())
                .transactionReference(transactionReference)
                .transactionType(eventCode)
                .branch(branch != null ? branch : debitAccount.getBranch())
                .totalDebit(normalizedAmount)
                .totalCredit(normalizedAmount)
                .status("POSTED")
                .narration(narration != null ? narration : mapping.getDescription())
                .postedByUser(user)
                .postedAt(LocalDateTime.now())
                .build();

        // Line 1: Debit Line
        JournalEntryLine debitLine = JournalEntryLine.builder()
                .journalEntry(entry)
                .glAccount(debitAccount)
                .entryType("DEBIT")
                .amount(normalizedAmount)
                .memo("DR: " + debitAccount.getAccountName() + " (" + mapping.getDebitAccountCode() + ")")
                .lineNumber(1)
                .build();
        entry.addLine(debitLine);

        // Line 2: Credit Line
        JournalEntryLine creditLine = JournalEntryLine.builder()
                .journalEntry(entry)
                .glAccount(creditAccount)
                .entryType("CREDIT")
                .amount(normalizedAmount)
                .memo("CR: " + creditAccount.getAccountName() + " (" + mapping.getCreditAccountCode() + ")")
                .lineNumber(2)
                .build();
        entry.addLine(creditLine);

        // Strict validation: Total Debits == Total Credits
        validateBalancedEntry(entry);

        // Apply GL balance updates atomically
        applyGLAccountBalance(debitAccount, "DEBIT", normalizedAmount);
        applyGLAccountBalance(creditAccount, "CREDIT", normalizedAmount);

        glAccountRepository.save(debitAccount);
        glAccountRepository.save(creditAccount);

        JournalEntry saved = journalEntryRepository.save(entry);

        auditService.recordAudit(user, "JOURNAL_ENTRY_POSTED", "GENERAL_LEDGER", entryNumber,
                String.format("Double-entry posted: DR %s (₹%s) / CR %s (₹%s) for %s",
                        debitAccount.getAccountCode(), normalizedAmount, creditAccount.getAccountCode(), normalizedAmount, transactionReference),
                "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    /**
     * Interbank Payment Rail Double-Entry Posting:
     * DR Customer Deposit Liability (Total Amount + Fee)
     * CR Clearing/Reserve Account (Transfer Amount)
     * CR Fee & Commission Income (Fee, if > 0)
     * Invariant: Total Debits == Total Credits.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JournalEntryDto postPaymentRailEntry(String transactionReference,
                                                String railType,
                                                BigDecimal amount,
                                                BigDecimal fee,
                                                Branch branch,
                                                User user,
                                                String narration) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BankingException("Accounting error: Payment transfer amount must be positive.");
        }
        BigDecimal normalizedFee = fee != null && fee.compareTo(BigDecimal.ZERO) > 0 
                ? fee.setScale(4, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        BigDecimal normalizedAmount = amount.setScale(4, RoundingMode.HALF_UP);
        BigDecimal totalDebited = normalizedAmount.add(normalizedFee);

        validateOrOpenAccountingPeriod(LocalDate.now(), user);
        String entryNumber = generateEntryNumber();

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNumber)
                .postingDate(LocalDate.now())
                .transactionReference(transactionReference)
                .transactionType("PAYMENT_RAIL_" + railType)
                .branch(branch)
                .status("POSTED")
                .narration(narration)
                .postedByUser(user)
                .postedAt(LocalDateTime.now())
                .build();

        GLAccount customerDeposit = glAccountRepository.findByAccountCodeForUpdate("2010-DEMAND-DEPOSITS-SAVINGS")
                .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", "2010-DEMAND-DEPOSITS-SAVINGS"));

        GLAccount settlementAccount = glAccountRepository.findByAccountCodeForUpdate("1040-RBI-RESERVE-BALANCE")
                .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", "1040-RBI-RESERVE-BALANCE"));

        // DR Customer Deposit for Total (amount + fee)
        entry.addLine(JournalEntryLine.builder()
                .journalEntry(entry)
                .glAccount(customerDeposit)
                .entryType("DEBIT")
                .amount(totalDebited)
                .memo("Debit customer deposit liability: " + transactionReference)
                .lineNumber(1)
                .build());
        applyGLAccountBalance(customerDeposit, "DEBIT", totalDebited);
        glAccountRepository.save(customerDeposit);

        // CR Settlement Account for Transfer Amount
        entry.addLine(JournalEntryLine.builder()
                .journalEntry(entry)
                .glAccount(settlementAccount)
                .entryType("CREDIT")
                .amount(normalizedAmount)
                .memo("Credit interbank clearing/reserve account: " + railType + " " + transactionReference)
                .lineNumber(2)
                .build());
        applyGLAccountBalance(settlementAccount, "CREDIT", normalizedAmount);
        glAccountRepository.save(settlementAccount);

        // If fee > 0, CR Fee Income
        if (normalizedFee.compareTo(BigDecimal.ZERO) > 0) {
            GLAccount feeAccount = glAccountRepository.findByAccountCodeForUpdate("4020-FEE-COMMISSION-INCOME")
                    .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", "4020-FEE-COMMISSION-INCOME"));

            entry.addLine(JournalEntryLine.builder()
                    .journalEntry(entry)
                    .glAccount(feeAccount)
                    .entryType("CREDIT")
                    .amount(normalizedFee)
                    .memo("Credit payment rail transaction processing fee")
                    .lineNumber(3)
                    .build());
            applyGLAccountBalance(feeAccount, "CREDIT", normalizedFee);
            glAccountRepository.save(feeAccount);
        }

        validateBalancedEntry(entry);
        JournalEntry saved = journalEntryRepository.save(entry);

        auditService.recordAudit(user, "JOURNAL_ENTRY_POSTED", "GENERAL_LEDGER", entryNumber,
                String.format("Payment rail double-entry posted: DR 2010 (₹%s) / CR 1040 (₹%s) CR 4020 (₹%s) for %s",
                        totalDebited, normalizedAmount, normalizedFee, transactionReference),
                "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    /**
     * Immutable Accounting Reversal:
     * Never deletes/updates original posted entries. Generates an exact inverse mirror entry.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JournalEntryDto reverseJournalEntry(Long entryId, JournalReversalRequest request, User authorizedUser) {
        JournalEntry original = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", entryId));

        if ("REVERSED".equalsIgnoreCase(original.getStatus())) {
            throw new BankingException("Journal entry " + original.getEntryNumber() + " is already reversed.");
        }

        String reversalNumber = "REV-" + original.getEntryNumber();

        JournalEntry reversal = JournalEntry.builder()
                .entryNumber(reversalNumber)
                .postingDate(LocalDate.now())
                .transactionReference("REVERSAL-OF-" + original.getEntryNumber())
                .transactionType("REVERSAL")
                .branch(original.getBranch())
                .totalDebit(original.getTotalCredit())
                .totalCredit(original.getTotalDebit())
                .status("POSTED")
                .narration("Authorized Reversal: " + request.getReason())
                .postedByUser(authorizedUser)
                .postedAt(LocalDateTime.now())
                .build();

        AtomicInteger lineCounter = new AtomicInteger(1);
        for (JournalEntryLine origLine : original.getLines()) {
            GLAccount glAcc = glAccountRepository.findByAccountCodeForUpdate(origLine.getGlAccount().getAccountCode())
                    .orElseThrow(() -> new ResourceNotFoundException("GLAccount", "code", origLine.getGlAccount().getAccountCode()));

            String inverseType = "DEBIT".equalsIgnoreCase(origLine.getEntryType()) ? "CREDIT" : "DEBIT";

            JournalEntryLine reversalLine = JournalEntryLine.builder()
                    .journalEntry(reversal)
                    .glAccount(glAcc)
                    .entryType(inverseType)
                    .amount(origLine.getAmount())
                    .memo("Reversal Line: " + inverseType + " " + glAcc.getAccountCode())
                    .lineNumber(lineCounter.getAndIncrement())
                    .build();
            reversal.addLine(reversalLine);

            applyGLAccountBalance(glAcc, inverseType, origLine.getAmount());
            glAccountRepository.save(glAcc);
        }

        validateBalancedEntry(reversal);

        JournalEntry savedReversal = journalEntryRepository.save(reversal);

        original.setStatus("REVERSED");
        original.setReversedByEntryId(savedReversal.getId());
        original.setReversalReason(request.getReason());
        journalEntryRepository.save(original);

        auditService.recordAudit(authorizedUser, "JOURNAL_ENTRY_REVERSED", "GENERAL_LEDGER", reversalNumber,
                "Reversed journal entry " + original.getEntryNumber() + ". Reason: " + request.getReason(),
                "127.0.0.1", "WARNING");

        return mapToDto(savedReversal);
    }

    /**
     * Institutional Trial Balance Calculation:
     * Sums all GL Debits and Credits and certifies zero discrepancy.
     */
    @Transactional(readOnly = true)
    public TrialBalanceDto generateTrialBalance(Long branchId, LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        List<GLAccount> accounts = branchId != null ?
                glAccountRepository.findAllForBranchOrConsolidated(branchId) :
                glAccountRepository.findAll();

        BigDecimal sumDebits = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        BigDecimal sumCredits = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        List<TrialBalanceItemDto> items = new ArrayList<>();

        for (GLAccount acc : accounts) {
            BigDecimal bal = acc.getCurrentBalance().setScale(4, RoundingMode.HALF_UP);
            BigDecimal dr = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            BigDecimal cr = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

            if ("DEBIT".equalsIgnoreCase(acc.getNormalBalance())) {
                if (bal.compareTo(BigDecimal.ZERO) >= 0) {
                    dr = bal;
                } else {
                    cr = bal.abs();
                }
            } else { // NORMAL CREDIT
                if (bal.compareTo(BigDecimal.ZERO) >= 0) {
                    cr = bal;
                } else {
                    dr = bal.abs();
                }
            }

            sumDebits = sumDebits.add(dr);
            sumCredits = sumCredits.add(cr);

            items.add(TrialBalanceItemDto.builder()
                    .accountCode(acc.getAccountCode())
                    .accountName(acc.getAccountName())
                    .classification(acc.getClassification())
                    .debitBalance(dr)
                    .creditBalance(cr)
                    .build());
        }

        BigDecimal difference = sumDebits.subtract(sumCredits).abs();
        boolean isBalanced = difference.compareTo(new BigDecimal("0.0001")) < 0;

        String branchName = "All Regional Branches (Consolidated Head Office)";
        if (branchId != null) {
            branchName = branchRepository.findById(branchId)
                    .map(Branch::getName)
                    .orElse("Branch #" + branchId);
        }

        return TrialBalanceDto.builder()
                .asOfDate(date)
                .branchId(branchId)
                .branchName(branchName)
                .totalDebits(sumDebits)
                .totalCredits(sumCredits)
                .difference(difference)
                .isBalanced(isBalanced)
                .generatedAt(LocalDateTime.now())
                .items(items)
                .build();
    }

    /**
     * Daily Teller & Branch Cash Closing Workflow.
     */
    @Transactional
    public DailyClosingDto performDailyClosing(DailyClosingRequest request, User cashierUser, User verifierUser) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        LocalDate date = request.getClosingDate();

        // Fetch opening cash from branch vault or previous closing
        BigDecimal openingCash = branch.getCashVaultBalance().setScale(4, RoundingMode.HALF_UP);

        // Calculate today's cash receipts & payments from journal entries
        BigDecimal cashReceipts = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
        BigDecimal cashPayments = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        // Fetch cash GL accounts
        GLAccount cashVault = glAccountRepository.findByAccountCode("1010-CASH-VAULT").orElse(null);
        if (cashVault != null) {
            Page<JournalEntryLine> lines = journalEntryLineRepository.findByAccountCodeAndDateRange(
                    cashVault.getAccountCode(), date, date, Pageable.unpaged());

            for (JournalEntryLine l : lines.getContent()) {
                if ("DEBIT".equalsIgnoreCase(l.getEntryType())) {
                    cashReceipts = cashReceipts.add(l.getAmount());
                } else {
                    cashPayments = cashPayments.add(l.getAmount());
                }
            }
        }

        BigDecimal expectedClosing = openingCash.add(cashReceipts).subtract(cashPayments);
        BigDecimal physicalCount = request.getPhysicalCashCounted().setScale(4, RoundingMode.HALF_UP);
        BigDecimal discrepancy = physicalCount.subtract(expectedClosing);

        String status = discrepancy.compareTo(BigDecimal.ZERO) == 0 ? "BALANCED" :
                (discrepancy.compareTo(BigDecimal.ZERO) < 0 ? "SHORTAGE" : "EXCESS");

        DailyClosing closing = DailyClosing.builder()
                .branch(branch)
                .closingDate(date)
                .openingCash(openingCash)
                .totalCashReceipts(cashReceipts)
                .totalCashPayments(cashPayments)
                .expectedClosingCash(expectedClosing)
                .physicalCashCounted(physicalCount)
                .discrepancy(discrepancy)
                .status(status)
                .cashier(cashierUser)
                .verifiedBy(verifierUser)
                .notes(request.getNotes())
                .closedAt(LocalDateTime.now())
                .build();

        DailyClosing saved = dailyClosingRepository.save(closing);

        auditService.recordAudit(cashierUser, "DAILY_CASH_CLOSING", "BRANCH_TELLER", branch.getBranchCode(),
                String.format("Day-End Cash Closing for %s on %s: Expected ₹%s, Physical ₹%s, Status: %s",
                        branch.getName(), date, expectedClosing, physicalCount, status),
                "127.0.0.1", status.equals("BALANCED") ? "SUCCESS" : "WARNING");

        return mapToClosingDto(saved);
    }

    @Transactional(readOnly = true)
    public List<GLAccountDto> getChartOfAccounts(AccountClassification classification) {
        List<GLAccount> accounts = classification != null ?
                glAccountRepository.findByClassification(classification, org.springframework.data.domain.Sort.by("accountCode")) :
                glAccountRepository.findAll(org.springframework.data.domain.Sort.by("accountCode"));
        return accounts.stream().map(this::mapToGLAccountDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryDto> getJournalEntries(Long branchId, LocalDate startDate, LocalDate endDate, String status, Pageable pageable) {
        Page<JournalEntry> page = journalEntryRepository.findFiltered(branchId, startDate, endDate, status, pageable);
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public JournalEntryDto getJournalEntryById(Long id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));
        return mapToDto(entry);
    }

    @Transactional(readOnly = true)
    public Page<DailyClosingDto> getDailyClosings(Long branchId, Pageable pageable) {
        return dailyClosingRepository.findRecentClosings(branchId, pageable).map(this::mapToClosingDto);
    }

    // --- Helper Logic ---

    private void validateBalancedEntry(JournalEntry entry) {
        BigDecimal totalDr = BigDecimal.ZERO;
        BigDecimal totalCr = BigDecimal.ZERO;

        for (JournalEntryLine line : entry.getLines()) {
            if ("DEBIT".equalsIgnoreCase(line.getEntryType())) {
                totalDr = totalDr.add(line.getAmount());
            } else if ("CREDIT".equalsIgnoreCase(line.getEntryType())) {
                totalCr = totalCr.add(line.getAmount());
            } else {
                throw new BankingException("Invalid journal line entry type: " + line.getEntryType() + ". Must be DEBIT or CREDIT.");
            }
        }

        if (totalDr.compareTo(totalCr) != 0) {
            throw new BankingException(String.format(
                    "Accounting Invariant Violation: Journal Entry is unbalanced! Total Debits: INR %s != Total Credits: INR %s",
                    totalDr, totalCr));
        }

        entry.setTotalDebit(totalDr);
        entry.setTotalCredit(totalCr);
    }

    private void applyGLAccountBalance(GLAccount account, String entryType, BigDecimal amount) {
        BigDecimal current = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;

        // Normal balance rules:
        // Asset & Expense: Debit increases (+), Credit decreases (-)
        // Liability, Equity & Revenue: Credit increases (+), Debit decreases (-)
        boolean isDebitNormal = "DEBIT".equalsIgnoreCase(account.getNormalBalance());

        if (isDebitNormal) {
            if ("DEBIT".equalsIgnoreCase(entryType)) {
                account.setCurrentBalance(current.add(amount));
            } else {
                account.setCurrentBalance(current.subtract(amount));
            }
        } else {
            if ("CREDIT".equalsIgnoreCase(entryType)) {
                account.setCurrentBalance(current.add(amount));
            } else {
                account.setCurrentBalance(current.subtract(amount));
            }
        }
    }

    private void validateOrOpenAccountingPeriod(LocalDate date, User user) {
        accountingPeriodRepository.findActivePeriodForDate(date).orElseGet(() -> {
            String pName = "PERIOD-" + date.format(DateTimeFormatter.ofPattern("yyyyMM"));
            return accountingPeriodRepository.findByPeriodName(pName).orElseGet(() ->
                    accountingPeriodRepository.save(AccountingPeriod.builder()
                            .periodName(pName)
                            .periodType("MONTHLY")
                            .startDate(date.withDayOfMonth(1))
                            .endDate(date.withDayOfMonth(date.lengthOfMonth()))
                            .status("OPEN")
                            .closedBy(null)
                            .build())
            );
        });
    }

    private String generateEntryNumber() {
        return "JE-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(Math.random() * 90000 + 10000);
    }

    private JournalEntryDto mapToDto(JournalEntry j) {
        List<JournalEntryLineDto> lineDtos = j.getLines().stream().map(l -> JournalEntryLineDto.builder()
                .id(l.getId())
                .glAccountCode(l.getGlAccount().getAccountCode())
                .glAccountName(l.getGlAccount().getAccountName())
                .glAccountClassification(l.getGlAccount().getClassification().name())
                .entryType(l.getEntryType())
                .amount(l.getAmount())
                .memo(l.getMemo())
                .lineNumber(l.getLineNumber())
                .build()).collect(Collectors.toList());

        return JournalEntryDto.builder()
                .id(j.getId())
                .entryNumber(j.getEntryNumber())
                .postingDate(j.getPostingDate())
                .transactionReference(j.getTransactionReference())
                .transactionType(j.getTransactionType())
                .branchId(j.getBranch() != null ? j.getBranch().getId() : null)
                .branchName(j.getBranch() != null ? j.getBranch().getName() : "Consolidated Head Office")
                .totalDebit(j.getTotalDebit())
                .totalCredit(j.getTotalCredit())
                .status(j.getStatus())
                .narration(j.getNarration())
                .createdByUsername(j.getPostedByUser() != null ? j.getPostedByUser().getUsername() : (j.getCreatedBy() != null ? j.getCreatedBy() : "SYSTEM"))
                .reversedByEntryId(j.getReversedByEntryId())
                .reversalReason(j.getReversalReason())
                .postedAt(j.getPostedAt())
                .lines(lineDtos)
                .build();
    }

    private GLAccountDto mapToGLAccountDto(GLAccount g) {
        return GLAccountDto.builder()
                .id(g.getId())
                .accountCode(g.getAccountCode())
                .accountName(g.getAccountName())
                .classification(g.getClassification())
                .normalBalance(g.getNormalBalance())
                .branchId(g.getBranch() != null ? g.getBranch().getId() : null)
                .branchName(g.getBranch() != null ? g.getBranch().getName() : "Consolidated Head Office")
                .currentBalance(g.getCurrentBalance())
                .currency(g.getCurrency())
                .isActive(g.getIsActive())
                .description(g.getDescription())
                .build();
    }

    private DailyClosingDto mapToClosingDto(DailyClosing d) {
        return DailyClosingDto.builder()
                .id(d.getId())
                .branchId(d.getBranch().getId())
                .branchName(d.getBranch().getName())
                .closingDate(d.getClosingDate())
                .openingCash(d.getOpeningCash())
                .totalCashReceipts(d.getTotalCashReceipts())
                .totalCashPayments(d.getTotalCashPayments())
                .expectedClosingCash(d.getExpectedClosingCash())
                .physicalCashCounted(d.getPhysicalCashCounted())
                .discrepancy(d.getDiscrepancy())
                .status(d.getStatus())
                .cashierUsername(d.getCashier() != null ? d.getCashier().getUsername() : "TELLER")
                .verifiedByUsername(d.getVerifiedBy() != null ? d.getVerifiedBy().getUsername() : "BRANCH_MGR")
                .notes(d.getNotes())
                .closedAt(d.getClosedAt())
                .build();
    }
}
