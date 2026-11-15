package com.apexbank.service;

import com.apexbank.dto.loan.LoanApplicationDto;
import com.apexbank.dto.loan.LoanApplicationRequest;
import com.apexbank.dto.loan.LoanDto;
import com.apexbank.dto.loan.LoanRepaymentDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanRepository loanRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;

    public LoanService(LoanApplicationRepository loanApplicationRepository,
                       LoanRepository loanRepository,
                       LoanRepaymentRepository loanRepaymentRepository,
                       CustomerRepository customerRepository,
                       BranchRepository branchRepository,
                       BankAccountRepository bankAccountRepository,
                       TransactionRepository transactionRepository,
                       TransactionLedgerEntryRepository ledgerEntryRepository,
                       AuditService auditService,
                       AccountingEngineService accountingEngineService) {
        this.loanApplicationRepository = loanApplicationRepository;
        this.loanRepository = loanRepository;
        this.loanRepaymentRepository = loanRepaymentRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
    }

    @Transactional
    public LoanApplicationDto submitApplication(LoanApplicationRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        String appNo = "LN-APP-" + branch.getBranchCode() + "-" + System.currentTimeMillis();

        LoanApplication app = LoanApplication.builder()
                .applicationNumber(appNo)
                .customer(customer)
                .branch(branch)
                .loanType(request.getLoanType())
                .requestedAmount(request.getRequestedAmount())
                .requestedTenureMonths(request.getRequestedTenureMonths())
                .purpose(request.getPurpose())
                .monthlyIncome(request.getMonthlyIncome())
                .creditScore(740 + (int)(Math.random() * 80))
                .status("SUBMITTED")
                .applicationDate(LocalDateTime.now())
                .build();

        LoanApplication saved = loanApplicationRepository.save(app);
        return mapToAppDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanApplicationDto> getApplications(Long branchId, String status, Pageable pageable) {
        Page<LoanApplication> page;
        if (status != null && !status.isEmpty()) {
            page = loanApplicationRepository.findByStatus(status, pageable);
        } else if (branchId != null) {
            page = loanApplicationRepository.findByBranchId(branchId, pageable);
        } else {
            page = loanApplicationRepository.findAll(pageable);
        }
        return page.map(this::mapToAppDto);
    }

    @Transactional
    public LoanDto approveAndDisburseLoan(Long applicationId, User sanctioningOfficer) {
        LoanApplication app = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("LoanApplication", "id", applicationId));

        if (!"SUBMITTED".equalsIgnoreCase(app.getStatus()) && !"UNDER_REVIEW".equalsIgnoreCase(app.getStatus())) {
            throw new BankingException("Application is already " + app.getStatus());
        }

        app.setStatus("APPROVED");
        app.setAssignedOfficer(sanctioningOfficer);
        loanApplicationRepository.save(app);

        // Calculate interest rate based on loan type
        BigDecimal annualRate = switch (app.getLoanType().toUpperCase()) {
            case "HOME" -> new BigDecimal("8.50");
            case "VEHICLE" -> new BigDecimal("9.25");
            case "EDUCATION" -> new BigDecimal("8.00");
            case "BUSINESS" -> new BigDecimal("11.50");
            default -> new BigDecimal("12.00"); // PERSONAL
        };

        BigDecimal principal = app.getRequestedAmount();
        int months = app.getRequestedTenureMonths();

        // Standard reducing balance EMI formula
        BigDecimal emi = calculateEmi(principal, annualRate, months);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(months)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInterest = totalPayable.subtract(principal);

        String loanAccNo = "LA-" + app.getBranch().getBranchCode() + "-" + (100000 + (System.currentTimeMillis() % 900000));

        Loan loan = Loan.builder()
                .loanAccountNumber(loanAccNo)
                .loanApplication(app)
                .customer(app.getCustomer())
                .branch(app.getBranch())
                .loanType(app.getLoanType())
                .principalAmount(principal)
                .interestRate(annualRate)
                .tenureMonths(months)
                .monthlyEmi(emi)
                .totalInterest(totalInterest)
                .totalPayable(totalPayable)
                .outstandingPrincipal(principal)
                .status("ACTIVE")
                .sanctionedDate(LocalDateTime.now())
                .maturityDate(LocalDateTime.now().plusMonths(months))
                .nextDueDate(LocalDateTime.now().plusMonths(1))
                .build();
        Loan savedLoan = loanRepository.save(loan);

        // Generate EMI Amortization Schedule
        generateAmortizationSchedule(savedLoan, principal, annualRate, months, emi);

        // Disburse loan into customer's primary savings account if exists
        List<BankAccount> customerAccounts = bankAccountRepository.findByCustomerId(app.getCustomer().getId());
        if (!customerAccounts.isEmpty()) {
            BankAccount primaryAcc = customerAccounts.get(0);
            primaryAcc.setBalance(primaryAcc.getBalance().add(principal));
            primaryAcc.setAvailableBalance(primaryAcc.getAvailableBalance().add(principal));
            bankAccountRepository.save(primaryAcc);

            String txnRef = "TXN-DSB-" + System.currentTimeMillis();
            Transaction dsbTxn = Transaction.builder()
                    .referenceNumber(txnRef)
                    .destinationAccount(primaryAcc)
                    .amount(principal)
                    .transactionType(TransactionType.LOAN_DISBURSEMENT)
                    .status(TransactionStatus.SUCCESS)
                    .paymentChannel("CLEARING_HOUSE")
                    .narration("Loan disbursement for " + loanAccNo)
                    .initiatedBy(sanctioningOfficer)
                    .branch(app.getBranch())
                    .transactionTimestamp(LocalDateTime.now())
                    .build();
            transactionRepository.save(dsbTxn);

            TransactionLedgerEntry creditEntry = TransactionLedgerEntry.builder()
                    .transaction(dsbTxn)
                    .account(primaryAcc)
                    .entryType("CREDIT")
                    .amount(principal)
                    .runningBalance(primaryAcc.getBalance())
                    .entryTimestamp(LocalDateTime.now())
                    .build();
            ledgerEntryRepository.save(creditEntry);

            // Core Double-Entry General Ledger Posting: DR 1020-LOANS-ADVANCES / CR 2010-DEMAND-DEPOSITS-SAVINGS
            accountingEngineService.postTransactionAccountingEntry(
                    txnRef, "LOAN_DISBURSEMENT", principal, app.getBranch(), sanctioningOfficer,
                    "Loan facility disbursement for " + loanAccNo
            );
        }

        auditService.recordAudit(sanctioningOfficer, "LOAN_SANCTIONED", "LENDING", loanAccNo,
                "Sanctioned " + app.getLoanType() + " of INR " + principal + " at " + annualRate + "% for " + months + " months", "127.0.0.1", "SUCCESS");

        return mapToLoanDto(savedLoan);
    }

    @Transactional(readOnly = true)
    public Page<LoanDto> getLoans(Long branchId, Pageable pageable) {
        Page<Loan> page = branchId != null ? loanRepository.findByBranchId(branchId, pageable) : loanRepository.findAll(pageable);
        return page.map(this::mapToLoanDto);
    }

    @Transactional(readOnly = true)
    public List<LoanRepaymentDto> getRepayments(Long loanId) {
        List<LoanRepayment> repayments = loanRepaymentRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
        return repayments.stream().map(r -> LoanRepaymentDto.builder()
                .id(r.getId())
                .loanId(loanId)
                .installmentNumber(r.getInstallmentNumber())
                .emiAmount(r.getEmiAmount())
                .principalComponent(r.getPrincipalComponent())
                .interestComponent(r.getInterestComponent())
                .dueDate(r.getDueDate())
                .paidDate(r.getPaidDate())
                .status(r.getStatus())
                .penaltyAmount(r.getPenaltyAmount())
                .build()).collect(Collectors.toList());
    }

    private BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        double p = principal.doubleValue();
        double r = (annualRate.doubleValue() / 12) / 100;
        int n = tenureMonths;
        double emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
    }

    private void generateAmortizationSchedule(Loan loan, BigDecimal principal, BigDecimal annualRate, int months, BigDecimal emi) {
        BigDecimal balance = principal;
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 8, RoundingMode.HALF_UP);

        for (int i = 1; i <= months; i++) {
            BigDecimal interestComp = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interestComp).setScale(2, RoundingMode.HALF_UP);
            if (i == months || principalComp.compareTo(balance) > 0) {
                principalComp = balance;
                emi = principalComp.add(interestComp);
            }
            balance = balance.subtract(principalComp);

            LoanRepayment repayment = LoanRepayment.builder()
                    .loan(loan)
                    .installmentNumber(i)
                    .emiAmount(emi)
                    .principalComponent(principalComp)
                    .interestComponent(interestComp)
                    .dueDate(LocalDateTime.now().plusMonths(i))
                    .status("SCHEDULED")
                    .penaltyAmount(BigDecimal.ZERO)
                    .build();
            loanRepaymentRepository.save(repayment);
        }
    }

    public LoanApplicationDto mapToAppDto(LoanApplication a) {
        return LoanApplicationDto.builder()
                .id(a.getId())
                .applicationNumber(a.getApplicationNumber())
                .customerId(a.getCustomer().getId())
                .customerName(a.getCustomer().getFullName())
                .customerNumber(a.getCustomer().getCustomerNumber())
                .branchId(a.getBranch().getId())
                .branchName(a.getBranch().getName())
                .loanType(a.getLoanType())
                .requestedAmount(a.getRequestedAmount())
                .requestedTenureMonths(a.getRequestedTenureMonths())
                .purpose(a.getPurpose())
                .monthlyIncome(a.getMonthlyIncome())
                .creditScore(a.getCreditScore())
                .status(a.getStatus())
                .remarks(a.getRemarks())
                .applicationDate(a.getApplicationDate())
                .build();
    }

    public LoanDto mapToLoanDto(Loan l) {
        return LoanDto.builder()
                .id(l.getId())
                .loanAccountNumber(l.getLoanAccountNumber())
                .customerId(l.getCustomer().getId())
                .customerName(l.getCustomer().getFullName())
                .branchId(l.getBranch().getId())
                .branchName(l.getBranch().getName())
                .loanType(l.getLoanType())
                .principalAmount(l.getPrincipalAmount())
                .interestRate(l.getInterestRate())
                .tenureMonths(l.getTenureMonths())
                .monthlyEmi(l.getMonthlyEmi())
                .totalInterest(l.getTotalInterest())
                .totalPayable(l.getTotalPayable())
                .outstandingPrincipal(l.getOutstandingPrincipal())
                .status(l.getStatus())
                .sanctionedDate(l.getSanctionedDate())
                .maturityDate(l.getMaturityDate())
                .nextDueDate(l.getNextDueDate())
                .build();
    }
}
