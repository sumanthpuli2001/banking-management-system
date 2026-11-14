package com.apexbank.service;

import com.apexbank.dto.account.AccountCreateRequest;
import com.apexbank.dto.account.AccountStatusUpdateRequest;
import com.apexbank.dto.account.BankAccountDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final AccountStatusHistoryRepository statusHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;

    public BankAccountService(BankAccountRepository bankAccountRepository,
                              CustomerRepository customerRepository,
                              BranchRepository branchRepository,
                              AccountStatusHistoryRepository statusHistoryRepository,
                              TransactionRepository transactionRepository,
                              TransactionLedgerEntryRepository ledgerEntryRepository,
                              AuditService auditService) {
        this.bankAccountRepository = bankAccountRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<BankAccountDto> getAccounts(Long branchId, String status, Pageable pageable) {
        Page<BankAccount> page;
        if (status != null && !status.isEmpty()) {
            page = bankAccountRepository.findByStatus(status, pageable);
        } else if (branchId != null) {
            page = bankAccountRepository.findByBranchId(branchId, pageable);
        } else {
            page = bankAccountRepository.findAll(pageable);
        }
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public BankAccountDto getAccountById(Long id) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", id));
        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public BankAccountDto getAccountByNumber(String accountNumber) {
        BankAccount account = bankAccountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", accountNumber));
        return mapToDto(account);
    }

    @Transactional(readOnly = true)
    public List<BankAccountDto> getAccountsByCustomerId(Long customerId) {
        List<BankAccount> accounts = bankAccountRepository.findByCustomerId(customerId);
        return accounts.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public BankAccountDto createAccount(AccountCreateRequest request, User currentUser) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        String accountNumber = generateUniqueAccountNumber(branch.getBranchCode());
        BigDecimal initialBal = request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO;

        BigDecimal interestRate = switch (request.getAccountType()) {
            case SAVINGS -> new BigDecimal("4.00");
            case CURRENT -> BigDecimal.ZERO;
            case SALARY -> new BigDecimal("4.25");
            case FIXED_DEPOSIT -> new BigDecimal("7.10");
            case RECURRING_DEPOSIT -> new BigDecimal("6.85");
        };

        BankAccount account = BankAccount.builder()
                .accountNumber(accountNumber)
                .accountType(request.getAccountType())
                .customer(customer)
                .branch(branch)
                .balance(initialBal)
                .availableBalance(initialBal)
                .currency("INR")
                .status("ACTIVE")
                .interestRate(interestRate)
                .dailyWithdrawalLimit(new BigDecimal("100000.00"))
                .dailyTransferLimit(new BigDecimal("500000.00"))
                .openedDate(LocalDateTime.now())
                .build();

        BankAccount saved = bankAccountRepository.save(account);

        // Record initial deposit ledger entry if > 0
        if (initialBal.compareTo(BigDecimal.ZERO) > 0) {
            String txnRef = "TXN-INIT-" + System.currentTimeMillis();
            Transaction txn = Transaction.builder()
                    .referenceNumber(txnRef)
                    .idempotencyKey(txnRef)
                    .destinationAccount(saved)
                    .amount(initialBal)
                    .transactionType(TransactionType.CASH_DEPOSIT)
                    .status(TransactionStatus.SUCCESS)
                    .paymentChannel("BRANCH_COUNTER")
                    .narration("Account opening initial counter deposit")
                    .branch(branch)
                    .transactionTimestamp(LocalDateTime.now())
                    .build();
            Transaction savedTxn = transactionRepository.save(txn);

            TransactionLedgerEntry creditEntry = TransactionLedgerEntry.builder()
                    .transaction(savedTxn)
                    .account(saved)
                    .entryType("CREDIT")
                    .amount(initialBal)
                    .runningBalance(initialBal)
                    .entryTimestamp(LocalDateTime.now())
                    .build();
            ledgerEntryRepository.save(creditEntry);
        }

        auditService.recordAudit(currentUser, "ACCOUNT_CREATION", "ACCOUNT", saved.getAccountNumber(),
                "Opened " + request.getAccountType() + " with initial deposit " + initialBal, "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    @Transactional
    public BankAccountDto updateAccountStatus(Long id, AccountStatusUpdateRequest request, User currentUser) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", id));

        String oldStatus = account.getStatus();
        account.setStatus(request.getNewStatus());
        account.setFreezeReason(request.getReason());
        if ("CLOSED".equalsIgnoreCase(request.getNewStatus())) {
            account.setClosedDate(LocalDateTime.now());
        }

        BankAccount saved = bankAccountRepository.save(account);

        AccountStatusHistory history = AccountStatusHistory.builder()
                .account(saved)
                .previousStatus(oldStatus)
                .newStatus(request.getNewStatus())
                .changedBy(currentUser != null ? currentUser.getUsername() : "SYSTEM")
                .reason(request.getReason())
                .changedAt(LocalDateTime.now())
                .build();
        statusHistoryRepository.save(history);

        auditService.recordAudit(currentUser, "ACCOUNT_STATUS_CHANGE", "ACCOUNT", saved.getAccountNumber(),
                "Changed status from " + oldStatus + " to " + request.getNewStatus() + ". Reason: " + request.getReason(), "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    private String generateUniqueAccountNumber(String branchCode) {
        Random random = new Random();
        String numericBranch = branchCode.replaceAll("[^0-9]", "10");
        if (numericBranch.length() > 4) numericBranch = numericBranch.substring(0, 4);
        while (numericBranch.length() < 4) numericBranch += "0";

        for (int i = 0; i < 10; i++) {
            long randNum = 10000000000L + (long)(random.nextDouble() * 89999999999L);
            String candidate = "5" + numericBranch + String.valueOf(randNum).substring(0, 11);
            if (!bankAccountRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        return "5" + numericBranch + System.currentTimeMillis();
    }

    public BankAccountDto mapToDto(BankAccount a) {
        return BankAccountDto.builder()
                .id(a.getId())
                .accountNumber(a.getAccountNumber())
                .accountType(a.getAccountType())
                .customerId(a.getCustomer() != null ? a.getCustomer().getId() : null)
                .customerName(a.getCustomer() != null ? a.getCustomer().getFullName() : "N/A")
                .customerNumber(a.getCustomer() != null ? a.getCustomer().getCustomerNumber() : "N/A")
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchCode(a.getBranch() != null ? a.getBranch().getBranchCode() : "N/A")
                .branchName(a.getBranch() != null ? a.getBranch().getName() : "N/A")
                .balance(a.getBalance())
                .availableBalance(a.getAvailableBalance())
                .currency(a.getCurrency())
                .status(a.getStatus())
                .interestRate(a.getInterestRate())
                .dailyWithdrawalLimit(a.getDailyWithdrawalLimit())
                .dailyTransferLimit(a.getDailyTransferLimit())
                .openedDate(a.getOpenedDate())
                .freezeReason(a.getFreezeReason())
                .build();
    }
}
