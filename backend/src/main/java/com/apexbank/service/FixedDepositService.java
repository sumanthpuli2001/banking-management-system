package com.apexbank.service;

import com.apexbank.dto.deposit.FixedDepositCreateRequest;
import com.apexbank.dto.deposit.FixedDepositDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FixedDepositService {

    private final FixedDepositRepository fixedDepositRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;

    public FixedDepositService(FixedDepositRepository fixedDepositRepository,
                               BankAccountRepository bankAccountRepository,
                               CustomerRepository customerRepository,
                               TransactionRepository transactionRepository,
                               TransactionLedgerEntryRepository ledgerEntryRepository,
                               AuditService auditService,
                               AccountingEngineService accountingEngineService) {
        this.fixedDepositRepository = fixedDepositRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
    }

    @Transactional
    public FixedDepositDto createFixedDeposit(FixedDepositCreateRequest request, User currentUser) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        BankAccount sourceAccount = bankAccountRepository.findByAccountNumberForUpdate(request.getSourceAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", request.getSourceAccountNumber()));

        BigDecimal amount = request.getDepositAmount();
        if (sourceAccount.getAvailableBalance().compareTo(amount) < 0) {
            throw new BankingException("Insufficient balance in source account: INR " + sourceAccount.getAvailableBalance());
        }

        // Determine interest rate by tenure
        int months = request.getTenureMonths();
        BigDecimal rate = months >= 36 ? new BigDecimal("7.50") : (months >= 12 ? new BigDecimal("7.10") : new BigDecimal("6.50"));

        // Quarterly compounded interest
        double p = amount.doubleValue();
        double r = rate.doubleValue() / 100.0;
        double t = months / 12.0;
        double maturity = p * Math.pow(1 + (r / 4.0), 4.0 * t);
        BigDecimal maturityAmount = BigDecimal.valueOf(maturity).setScale(2, RoundingMode.HALF_UP);

        // Deduct from source account
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(amount));
        sourceAccount.setAvailableBalance(sourceAccount.getAvailableBalance().subtract(amount));
        bankAccountRepository.save(sourceAccount);

        String certNo = "FD-" + sourceAccount.getBranch().getBranchCode() + "-" + System.currentTimeMillis();

        FixedDeposit fd = FixedDeposit.builder()
                .certificateNumber(certNo)
                .customer(customer)
                .sourceAccount(sourceAccount)
                .branch(sourceAccount.getBranch())
                .depositAmount(amount)
                .interestRate(rate)
                .tenureMonths(months)
                .maturityAmount(maturityAmount)
                .depositDate(LocalDateTime.now())
                .maturityDate(LocalDateTime.now().plusMonths(months))
                .autoRenew(request.isAutoRenew())
                .status("ACTIVE")
                .build();
        FixedDeposit savedFd = fixedDepositRepository.save(fd);

        // Record transaction
        String txnRef = "TXN-FD-" + System.currentTimeMillis();
        Transaction txn = Transaction.builder()
                .referenceNumber(txnRef)
                .sourceAccount(sourceAccount)
                .amount(amount)
                .transactionType(TransactionType.FD_CREATION)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("BRANCH_COUNTER")
                .narration("Term Fixed Deposit creation: " + certNo)
                .initiatedBy(currentUser)
                .branch(sourceAccount.getBranch())
                .transactionTimestamp(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(txn);

        TransactionLedgerEntry debitEntry = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(sourceAccount)
                .entryType("DEBIT")
                .amount(amount)
                .runningBalance(sourceAccount.getBalance())
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(debitEntry);

        // Core Double-Entry General Ledger Posting: DR 2010-DEMAND-DEPOSITS-SAVINGS / CR 2030-TERM-DEPOSITS-FD
        accountingEngineService.postTransactionAccountingEntry(
                txnRef, "FD_CREATION", amount, sourceAccount.getBranch(), currentUser,
                "Term Fixed Deposit creation: " + certNo
        );

        auditService.recordAudit(currentUser, "FD_CREATED", "TERM_DEPOSIT", certNo,
                "Fixed Deposit created for INR " + amount + " at " + rate + "% for " + months + " months", "127.0.0.1", "SUCCESS");

        return mapToDto(savedFd);
    }

    @Transactional(readOnly = true)
    public Page<FixedDepositDto> getFixedDeposits(Long branchId, Long customerId, Pageable pageable) {
        Page<FixedDeposit> page = branchId != null ?
                fixedDepositRepository.findByBranchId(branchId, pageable) :
                fixedDepositRepository.findAll(pageable);
        return page.map(this::mapToDto);
    }

    public FixedDepositDto mapToDto(FixedDeposit fd) {
        return FixedDepositDto.builder()
                .id(fd.getId())
                .certificateNumber(fd.getCertificateNumber())
                .customerId(fd.getCustomer().getId())
                .customerName(fd.getCustomer().getFullName())
                .sourceAccountNumber(fd.getSourceAccount() != null ? fd.getSourceAccount().getAccountNumber() : "N/A")
                .branchId(fd.getBranch().getId())
                .branchName(fd.getBranch().getName())
                .depositAmount(fd.getDepositAmount())
                .interestRate(fd.getInterestRate())
                .tenureMonths(fd.getTenureMonths())
                .maturityAmount(fd.getMaturityAmount())
                .depositDate(fd.getDepositDate())
                .maturityDate(fd.getMaturityDate())
                .autoRenew(fd.isAutoRenew())
                .status(fd.getStatus())
                .build();
    }
}
