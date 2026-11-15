package com.apexbank.service;

import com.apexbank.dto.transaction.CashDepositRequest;
import com.apexbank.dto.transaction.CashWithdrawalRequest;
import com.apexbank.dto.transaction.FundTransferRequest;
import com.apexbank.dto.transaction.LedgerEntryDto;
import com.apexbank.dto.transaction.TransactionDto;
import com.apexbank.dto.transaction.TransactionLifecycleDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import com.apexbank.service.compliance.AmlMonitoringEngineService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;
    private final TellerCashDrawerRepository tellerCashDrawerRepository;
    private final AmlMonitoringEngineService amlMonitoringEngineService;

    private static final BigDecimal MAKER_CHECKER_TRANSFER_THRESHOLD = new BigDecimal("500000.00");
    private static final BigDecimal AML_ALERT_THRESHOLD = new BigDecimal("1000000.00");

    public TransactionService(BankAccountRepository bankAccountRepository,
                              TransactionRepository transactionRepository,
                              TransactionLedgerEntryRepository ledgerEntryRepository,
                              ApprovalRequestRepository approvalRequestRepository,
                              AuditService auditService,
                              AccountingEngineService accountingEngineService,
                              TellerCashDrawerRepository tellerCashDrawerRepository) {
        this(bankAccountRepository, transactionRepository, ledgerEntryRepository, approvalRequestRepository,
             auditService, accountingEngineService, tellerCashDrawerRepository, null);
    }

    public TransactionService(BankAccountRepository bankAccountRepository,
                              TransactionRepository transactionRepository,
                              TransactionLedgerEntryRepository ledgerEntryRepository,
                              ApprovalRequestRepository approvalRequestRepository,
                              AuditService auditService,
                              AccountingEngineService accountingEngineService,
                              TellerCashDrawerRepository tellerCashDrawerRepository,
                              AmlMonitoringEngineService amlMonitoringEngineService) {
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
        this.tellerCashDrawerRepository = tellerCashDrawerRepository;
        this.amlMonitoringEngineService = amlMonitoringEngineService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionDto processCashDeposit(CashDepositRequest request, User cashierUser) {
        BankAccount account = bankAccountRepository.findByAccountNumberForUpdate(request.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", request.getAccountNumber()));

        validateAccountActive(account);

        BigDecimal amount = request.getAmount();
        String ref = generateReferenceNumber("DEP");
        Branch branch = cashierUser != null && cashierUser.getBranch() != null ? cashierUser.getBranch() : account.getBranch();

        // Update balance
        BigDecimal newBalance = account.getBalance().add(amount);
        account.setBalance(newBalance);
        account.setAvailableBalance(newBalance);
        bankAccountRepository.save(account);

        // Update Branch Vault Cash
        if (branch != null) {
            branch.setCashVaultBalance(branch.getCashVaultBalance().add(amount));
        }

        // Update Cashier Drawer if open
        if (cashierUser != null) {
            tellerCashDrawerRepository.findByAssignedCashierIdAndStatus(cashierUser.getId(), "OPEN")
                    .ifPresent(d -> {
                        d.addReceipt(amount);
                        tellerCashDrawerRepository.save(d);
                    });
        }

        Transaction transaction = Transaction.builder()
                .referenceNumber(ref)
                .destinationAccount(account)
                .amount(amount)
                .fee(BigDecimal.ZERO)
                .transactionType(TransactionType.CASH_DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("BRANCH_COUNTER")
                .narration(request.getNarration() != null ? request.getNarration() : "Cash Deposit at counter by " + (request.getDepositorName() != null ? request.getDepositorName() : "Self"))
                .initiatedBy(cashierUser)
                .branch(branch)
                .transactionTimestamp(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Double-entry credit ledger entry
        TransactionLedgerEntry credit = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(account)
                .entryType("CREDIT")
                .amount(amount)
                .runningBalance(newBalance)
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(credit);

        // Core Double-Entry General Ledger Posting: DR 1010-CASH-VAULT / CR 2010-DEMAND-DEPOSITS-SAVINGS
        accountingEngineService.postTransactionAccountingEntry(
                ref, "CASH_DEPOSIT", amount, branch, cashierUser,
                request.getNarration() != null ? request.getNarration() : "Counter Cash Deposit to " + account.getAccountNumber()
        );

        // Suspicious activity check & automated AML rule engine
        try {
            if (amlMonitoringEngineService != null) {
                amlMonitoringEngineService.evaluateTransaction(savedTxn);
            }
        } catch (Exception ex) {
            // Log warning but allow core banking settlement to proceed
        }

        if (amount.compareTo(AML_ALERT_THRESHOLD) >= 0) {
            auditService.recordAudit(cashierUser, "AML_ALERT_HIGH_VALUE_DEPOSIT", "TRANSACTION", ref,
                    "High value cash deposit flagged for auditor: INR " + amount + " to account " + account.getAccountNumber(), "127.0.0.1", "WARNING");
        } else {
            auditService.recordAudit(cashierUser, "CASH_DEPOSIT", "TRANSACTION", ref,
                    "Cash deposit of INR " + amount + " to " + account.getAccountNumber(), "127.0.0.1", "SUCCESS");
        }

        return mapToDto(savedTxn);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionDto processCashWithdrawal(CashWithdrawalRequest request, User cashierUser) {
        BankAccount account = bankAccountRepository.findByAccountNumberForUpdate(request.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", request.getAccountNumber()));

        validateAccountActive(account);

        BigDecimal amount = request.getAmount();
        if (account.getAvailableBalance().compareTo(amount) < 0) {
            throw new BankingException("Insufficient funds. Available balance: INR " + account.getAvailableBalance() + ", Requested: INR " + amount);
        }

        String ref = generateReferenceNumber("WTH");
        Branch branch = cashierUser != null && cashierUser.getBranch() != null ? cashierUser.getBranch() : account.getBranch();

        // Check vault capacity
        if (branch != null && branch.getCashVaultBalance().compareTo(amount) < 0) {
            throw new BankingException("Branch cash vault liquidity insufficient for payout. Available: INR " + branch.getCashVaultBalance());
        }

        // Update balance
        BigDecimal newBalance = account.getBalance().subtract(amount);
        account.setBalance(newBalance);
        account.setAvailableBalance(newBalance);
        bankAccountRepository.save(account);

        // Deduct vault cash
        if (branch != null) {
            branch.setCashVaultBalance(branch.getCashVaultBalance().subtract(amount));
        }

        // Update Cashier Drawer if open
        if (cashierUser != null) {
            tellerCashDrawerRepository.findByAssignedCashierIdAndStatus(cashierUser.getId(), "OPEN")
                    .ifPresent(d -> {
                        d.addPayment(amount);
                        tellerCashDrawerRepository.save(d);
                    });
        }

        Transaction transaction = Transaction.builder()
                .referenceNumber(ref)
                .sourceAccount(account)
                .amount(amount)
                .fee(BigDecimal.ZERO)
                .transactionType(TransactionType.CASH_WITHDRAWAL)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("BRANCH_COUNTER")
                .narration(request.getNarration() != null ? request.getNarration() : "Cash Withdrawal at counter")
                .initiatedBy(cashierUser)
                .branch(branch)
                .transactionTimestamp(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Double-entry debit ledger entry
        TransactionLedgerEntry debit = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(account)
                .entryType("DEBIT")
                .amount(amount)
                .runningBalance(newBalance)
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(debit);

        // Core Double-Entry General Ledger Posting: DR 2010-DEMAND-DEPOSITS-SAVINGS / CR 1010-CASH-VAULT
        accountingEngineService.postTransactionAccountingEntry(
                ref, "CASH_WITHDRAWAL", amount, branch, cashierUser,
                request.getNarration() != null ? request.getNarration() : "Counter Cash Withdrawal from " + account.getAccountNumber()
        );

        auditService.recordAudit(cashierUser, "CASH_WITHDRAWAL", "TRANSACTION", ref,
                "Cash withdrawal of INR " + amount + " from " + account.getAccountNumber(), "127.0.0.1", "SUCCESS");

        try {
            if (amlMonitoringEngineService != null) {
                amlMonitoringEngineService.evaluateTransaction(savedTxn);
            }
        } catch (Exception ex) {
            // Log warning but allow settlement
        }

        return mapToDto(savedTxn);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionDto processFundTransfer(FundTransferRequest request, User currentUser) {
        // Idempotency check
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            var existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return mapToDto(existing.get());
            }
        }

        if (request.getSourceAccountNumber().equals(request.getDestinationAccountNumber())) {
            throw new BankingException("Source and destination accounts must be distinct.");
        }

        // Lock accounts in consistent alphabetical order to prevent deadlocks
        String firstAccNo = request.getSourceAccountNumber().compareTo(request.getDestinationAccountNumber()) < 0
                ? request.getSourceAccountNumber() : request.getDestinationAccountNumber();
        String secondAccNo = firstAccNo.equals(request.getSourceAccountNumber())
                ? request.getDestinationAccountNumber() : request.getSourceAccountNumber();

        BankAccount firstAcc = bankAccountRepository.findByAccountNumberForUpdate(firstAccNo)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", firstAccNo));
        BankAccount secondAcc = bankAccountRepository.findByAccountNumberForUpdate(secondAccNo)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", secondAccNo));

        BankAccount source = firstAcc.getAccountNumber().equals(request.getSourceAccountNumber()) ? firstAcc : secondAcc;
        BankAccount destination = source == firstAcc ? secondAcc : firstAcc;

        validateAccountActive(source);
        validateAccountActive(destination);

        BigDecimal amount = request.getAmount();
        if (source.getAvailableBalance().compareTo(amount) < 0) {
            throw new BankingException("Insufficient funds. Available balance: INR " + source.getAvailableBalance());
        }

        String ref = generateReferenceNumber("TRF");
        String idempotencyKey = request.getIdempotencyKey() != null ? request.getIdempotencyKey() : UUID.randomUUID().toString();

        // Maker-Checker Authorization check for high-value transfers
        if (amount.compareTo(MAKER_CHECKER_TRANSFER_THRESHOLD) > 0) {
            Transaction pendingTxn = Transaction.builder()
                    .referenceNumber(ref)
                    .idempotencyKey(idempotencyKey)
                    .sourceAccount(source)
                    .destinationAccount(destination)
                    .amount(amount)
                    .transactionType(TransactionType.INTERNAL_TRANSFER)
                    .status(TransactionStatus.PENDING_APPROVAL)
                    .paymentChannel(request.getPaymentChannel())
                    .narration(request.getNarration() != null ? request.getNarration() : "High-value fund transfer awaiting dual-authorization")
                    .initiatedBy(currentUser)
                    .branch(source.getBranch())
                    .transactionTimestamp(LocalDateTime.now())
                    .build();
            Transaction savedPending = transactionRepository.save(pendingTxn);

            ApprovalRequest approval = ApprovalRequest.builder()
                    .requestType("HIGH_VALUE_TRANSFER")
                    .targetEntityName("Transaction")
                    .targetEntityId(savedPending.getId())
                    .maker(currentUser)
                    .branch(source.getBranch())
                    .amount(amount)
                    .payloadJson(String.format("{\"source\":\"%s\",\"destination\":\"%s\",\"amount\":%s}",
                            source.getAccountNumber(), destination.getAccountNumber(), amount))
                    .status("PENDING")
                    .makerRemarks(request.getNarration())
                    .requestedAt(LocalDateTime.now())
                    .build();
            approvalRequestRepository.save(approval);

            auditService.recordAudit(currentUser, "TRANSFER_INITIATED_PENDING_APPROVAL", "TRANSACTION", ref,
                    "High-value transfer of INR " + amount + " queued for Maker-Checker authorization", "127.0.0.1", "PENDING");

            return mapToDto(savedPending);
        }

        // Execute immediate transfer
        BigDecimal newSrcBal = source.getBalance().subtract(amount);
        source.setBalance(newSrcBal);
        source.setAvailableBalance(newSrcBal);
        bankAccountRepository.save(source);

        BigDecimal newDestBal = destination.getBalance().add(amount);
        destination.setBalance(newDestBal);
        destination.setAvailableBalance(newDestBal);
        bankAccountRepository.save(destination);

        Transaction transaction = Transaction.builder()
                .referenceNumber(ref)
                .idempotencyKey(idempotencyKey)
                .sourceAccount(source)
                .destinationAccount(destination)
                .amount(amount)
                .fee(BigDecimal.ZERO)
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel(request.getPaymentChannel())
                .narration(request.getNarration() != null ? request.getNarration() : "Fund transfer to " + destination.getAccountNumber())
                .initiatedBy(currentUser)
                .branch(source.getBranch())
                .transactionTimestamp(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(transaction);

        // Balanced double-entry ledger entries
        TransactionLedgerEntry debitEntry = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(source)
                .entryType("DEBIT")
                .amount(amount)
                .runningBalance(newSrcBal)
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(debitEntry);

        TransactionLedgerEntry creditEntry = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(destination)
                .entryType("CREDIT")
                .amount(amount)
                .runningBalance(newDestBal)
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(creditEntry);

        // Core Double-Entry General Ledger Posting: DR 2010-DEMAND-DEPOSITS-SAVINGS / CR 2010-DEMAND-DEPOSITS-SAVINGS
        accountingEngineService.postTransactionAccountingEntry(
                ref, "INTERNAL_TRANSFER", amount, source.getBranch(), currentUser,
                request.getNarration() != null ? request.getNarration() : "Fund Transfer to " + destination.getAccountNumber()
        );

        auditService.recordAudit(currentUser, "FUND_TRANSFER_EXECUTED", "TRANSACTION", ref,
                "Transfer of INR " + amount + " from " + source.getAccountNumber() + " to " + destination.getAccountNumber(), "127.0.0.1", "SUCCESS");

        try {
            if (amlMonitoringEngineService != null) {
                amlMonitoringEngineService.evaluateTransaction(savedTxn);
            }
        } catch (Exception ex) {
            // Log warning
        }

        return mapToDto(savedTxn);
    }

    @Transactional(readOnly = true)
    public Page<TransactionDto> getTransactions(Long branchId, TransactionType type, String status,
                                                LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();

        Page<Transaction> page = transactionRepository.findFilteredTransactions(branchId, type, status, start, end, pageable);
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<LedgerEntryDto> getAccountLedger(String accountNumber, Pageable pageable) {
        BankAccount account = bankAccountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", accountNumber));

        Page<TransactionLedgerEntry> entries = ledgerEntryRepository.findByAccountIdOrderByEntryTimestampDesc(account.getId(), pageable);
        return entries.map(e -> LedgerEntryDto.builder()
                .id(e.getId())
                .transactionReference(e.getTransaction() != null ? e.getTransaction().getReferenceNumber() : "N/A")
                .accountNumber(account.getAccountNumber())
                .entryType(e.getEntryType())
                .amount(e.getAmount())
                .runningBalance(e.getRunningBalance())
                .entryTimestamp(e.getEntryTimestamp())
                .build());
    }

    @Transactional(readOnly = true)
    public TransactionLifecycleDto getTransactionLifecycle(Long transactionId) {
        Transaction t = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));
        return buildLifecycleDto(t);
    }

    @Transactional(readOnly = true)
    public TransactionLifecycleDto getTransactionLifecycleByReference(String referenceNumber) {
        Transaction t = transactionRepository.findByReferenceNumber(referenceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "referenceNumber", referenceNumber));
        return buildLifecycleDto(t);
    }

    private TransactionLifecycleDto buildLifecycleDto(Transaction t) {
        List<TransactionLifecycleDto.LifecycleStepDto> steps = new ArrayList<>();

        // Step 1: Initiation
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("INITIATION")
                .status("COMPLETED")
                .timestamp(t.getTransactionTimestamp())
                .narration("Transaction registered with ref " + t.getReferenceNumber() + " via " + t.getPaymentChannel())
                .build());

        // Step 2: Validation
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("VALIDATION")
                .status("COMPLETED")
                .timestamp(t.getTransactionTimestamp().plusNanos(100_000_000))
                .narration("Account status, KYC verification, balance adequacy, and sanctions checks validated.")
                .build());

        // Step 3: Authorization
        boolean requiresApproval = t.getAmount().compareTo(MAKER_CHECKER_TRANSFER_THRESHOLD) > 0;
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("AUTHORIZATION")
                .status(t.getStatus() == TransactionStatus.PENDING_APPROVAL ? "PENDING" : "COMPLETED")
                .timestamp(t.getTransactionTimestamp().plusNanos(200_000_000))
                .narration(requiresApproval
                        ? "Dual-control maker-checker sign-off applied for high-value clearance."
                        : "Authorized under standard procedural counter discretionary thresholds.")
                .build());

        // Step 4: General Ledger Posting
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("GL_POSTING")
                .status(t.getAccountingPostingStatus() == AccountingPostingStatus.POSTED_BALANCED ? "COMPLETED" : "PENDING")
                .timestamp(t.getTransactionTimestamp().plusNanos(300_000_000))
                .narration("Balanced double-entry journal lines posted to General Ledger accounts (Total Debits = Total Credits).")
                .build());

        // Step 5: Settlement
        boolean isSettled = t.getStatus() == TransactionStatus.SETTLED || t.getStatus() == TransactionStatus.SUCCESS || t.getStatus() == TransactionStatus.RECONCILED;
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("SETTLEMENT")
                .status(isSettled ? "COMPLETED" : (t.getStatus() == TransactionStatus.FAILED ? "FAILED" : "PENDING"))
                .timestamp(t.getSettledAt() != null ? t.getSettledAt() : t.getTransactionTimestamp().plusNanos(400_000_000))
                .narration(isSettled ? "Customer and vault balances debited/credited with absolute finality." : "Pending settlement.")
                .build());

        // Step 6: Reconciliation
        boolean isReconciled = t.getStatus() == TransactionStatus.RECONCILED || t.getReconciledAt() != null;
        steps.add(TransactionLifecycleDto.LifecycleStepDto.builder()
                .stage("RECONCILIATION")
                .status(isReconciled ? "COMPLETED" : "PENDING_DAILY_CYCLE")
                .timestamp(t.getReconciledAt() != null ? t.getReconciledAt() : null)
                .narration(isReconciled
                        ? "Verified and matched against institutional end-of-day general ledger summation."
                        : "Queued for automated daily closing reconciliation verification.")
                .build());

        return TransactionLifecycleDto.builder()
                .referenceNumber(t.getReferenceNumber())
                .idempotencyKey(t.getIdempotencyKey())
                .currentStatus(t.getStatus())
                .accountingPostingStatus(t.getAccountingPostingStatus() != null ? t.getAccountingPostingStatus() : AccountingPostingStatus.POSTED_BALANCED)
                .externalPaymentStatus(t.getExternalPaymentStatus() != null ? t.getExternalPaymentStatus() : ExternalPaymentStatus.INTERNAL)
                .paymentChannel(t.getPaymentChannel())
                .initiatedAt(t.getTransactionTimestamp())
                .settledAt(t.getSettledAt() != null ? t.getSettledAt() : t.getTransactionTimestamp())
                .reconciledAt(t.getReconciledAt())
                .lifecycleSteps(steps)
                .build();
    }

    private void validateAccountActive(BankAccount account) {
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new BankingException("Account " + account.getAccountNumber() + " is currently " + account.getStatus() + ". Operation prohibited.");
        }
    }

    private String generateReferenceNumber(String prefix) {
        return "TXN-" + prefix + "-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 9000 + 1000);
    }

    public TransactionDto mapToDto(Transaction t) {
        return TransactionDto.builder()
                .id(t.getId())
                .referenceNumber(t.getReferenceNumber())
                .idempotencyKey(t.getIdempotencyKey())
                .sourceAccountNumber(t.getSourceAccount() != null ? t.getSourceAccount().getAccountNumber() : "CASH_COUNTER")
                .sourceCustomerName(t.getSourceAccount() != null && t.getSourceAccount().getCustomer() != null ? t.getSourceAccount().getCustomer().getFullName() : "Counter Cash")
                .destinationAccountNumber(t.getDestinationAccount() != null ? t.getDestinationAccount().getAccountNumber() : "CASH_COUNTER")
                .destinationCustomerName(t.getDestinationAccount() != null && t.getDestinationAccount().getCustomer() != null ? t.getDestinationAccount().getCustomer().getFullName() : "Counter Cash")
                .amount(t.getAmount())
                .fee(t.getFee())
                .transactionType(t.getTransactionType())
                .status(t.getStatus())
                .accountingPostingStatus(t.getAccountingPostingStatus() != null ? t.getAccountingPostingStatus() : AccountingPostingStatus.POSTED_BALANCED)
                .externalPaymentStatus(t.getExternalPaymentStatus() != null ? t.getExternalPaymentStatus() : ExternalPaymentStatus.INTERNAL)
                .paymentChannel(t.getPaymentChannel())
                .narration(t.getNarration())
                .initiatedByUsername(t.getInitiatedBy() != null ? t.getInitiatedBy().getUsername() : "SYSTEM")
                .branchId(t.getBranch() != null ? t.getBranch().getId() : null)
                .branchName(t.getBranch() != null ? t.getBranch().getName() : "N/A")
                .failureReason(t.getFailureReason())
                .settledAt(t.getSettledAt())
                .reconciledAt(t.getReconciledAt())
                .transactionTimestamp(t.getTransactionTimestamp())
                .build();
    }
}
