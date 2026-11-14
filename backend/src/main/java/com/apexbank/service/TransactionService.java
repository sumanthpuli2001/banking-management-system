package com.apexbank.service;

import com.apexbank.dto.transaction.CashDepositRequest;
import com.apexbank.dto.transaction.CashWithdrawalRequest;
import com.apexbank.dto.transaction.FundTransferRequest;
import com.apexbank.dto.transaction.LedgerEntryDto;
import com.apexbank.dto.transaction.TransactionDto;
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
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransactionService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final AuditService auditService;

    private static final BigDecimal MAKER_CHECKER_TRANSFER_THRESHOLD = new BigDecimal("500000.00");
    private static final BigDecimal AML_ALERT_THRESHOLD = new BigDecimal("1000000.00");

    public TransactionService(BankAccountRepository bankAccountRepository,
                              TransactionRepository transactionRepository,
                              TransactionLedgerEntryRepository ledgerEntryRepository,
                              ApprovalRequestRepository approvalRequestRepository,
                              AuditService auditService) {
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.auditService = auditService;
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

        // Suspicious activity check
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

        auditService.recordAudit(cashierUser, "CASH_WITHDRAWAL", "TRANSACTION", ref,
                "Cash withdrawal of INR " + amount + " from " + account.getAccountNumber(), "127.0.0.1", "SUCCESS");

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

        auditService.recordAudit(currentUser, "FUND_TRANSFER_EXECUTED", "TRANSACTION", ref,
                "Transfer of INR " + amount + " from " + source.getAccountNumber() + " to " + destination.getAccountNumber(), "127.0.0.1", "SUCCESS");

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
                .paymentChannel(t.getPaymentChannel())
                .narration(t.getNarration())
                .initiatedByUsername(t.getInitiatedBy() != null ? t.getInitiatedBy().getUsername() : "SYSTEM")
                .branchId(t.getBranch() != null ? t.getBranch().getId() : null)
                .branchName(t.getBranch() != null ? t.getBranch().getName() : "N/A")
                .failureReason(t.getFailureReason())
                .transactionTimestamp(t.getTransactionTimestamp())
                .build();
    }
}
