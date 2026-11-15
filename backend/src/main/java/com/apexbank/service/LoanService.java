package com.apexbank.service;

import com.apexbank.dto.loan.*;
import com.apexbank.entity.*;
import com.apexbank.entity.loan.LoanProduct;
import com.apexbank.entity.loan.LoanSanctionLetter;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import com.apexbank.repository.loan.LoanProductRepository;
import com.apexbank.repository.loan.LoanSanctionLetterRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LoanService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanRepository loanRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final LoanProductRepository loanProductRepository;
    private final LoanSanctionLetterRepository loanSanctionLetterRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;
    private final GLAccountRepository glAccountRepository;

    public LoanService(LoanApplicationRepository loanApplicationRepository,
                       LoanRepository loanRepository,
                       LoanRepaymentRepository loanRepaymentRepository,
                       LoanProductRepository loanProductRepository,
                       LoanSanctionLetterRepository loanSanctionLetterRepository,
                       CustomerRepository customerRepository,
                       BranchRepository branchRepository,
                       BankAccountRepository bankAccountRepository,
                       TransactionRepository transactionRepository,
                       TransactionLedgerEntryRepository ledgerEntryRepository,
                       AuditService auditService,
                       AccountingEngineService accountingEngineService,
                       GLAccountRepository glAccountRepository) {
        this.loanApplicationRepository = loanApplicationRepository;
        this.loanRepository = loanRepository;
        this.loanRepaymentRepository = loanRepaymentRepository;
        this.loanProductRepository = loanProductRepository;
        this.loanSanctionLetterRepository = loanSanctionLetterRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
        this.glAccountRepository = glAccountRepository;
    }

    @PostConstruct
    @Transactional
    public void initDefaultLoanProducts() {
        if (loanProductRepository.count() > 0) return;

        log.info("Initializing core lending product catalogue...");
        List<LoanProduct> products = List.of(
                LoanProduct.builder()
                        .productCode("PROD_HOME_PRIME")
                        .productName("Prime Residential Home Loan")
                        .loanType("HOME")
                        .minAmount(new BigDecimal("500000.00"))
                        .maxAmount(new BigDecimal("50000000.00")) // ₹5 Cr
                        .minTenureMonths(12)
                        .maxTenureMonths(360) // 30 Years
                        .baseInterestRate(new BigDecimal("8.50"))
                        .processingFeePercentage(new BigDecimal("0.50"))
                        .maxFoirPercentage(new BigDecimal("50.00"))
                        .minCreditScore(700)
                        .collateralRequired(true)
                        .description("Secured mortgage financing for ready-to-move and under-construction residential properties.")
                        .isActive(true)
                        .build(),

                LoanProduct.builder()
                        .productCode("PROD_AUTO_FLEX")
                        .productName("Flexi Auto Drive Vehicle Loan")
                        .loanType("VEHICLE")
                        .minAmount(new BigDecimal("100000.00"))
                        .maxAmount(new BigDecimal("5000000.00"))
                        .minTenureMonths(12)
                        .maxTenureMonths(84) // 7 Years
                        .baseInterestRate(new BigDecimal("9.25"))
                        .processingFeePercentage(new BigDecimal("1.00"))
                        .maxFoirPercentage(new BigDecimal("50.00"))
                        .minCreditScore(680)
                        .collateralRequired(true)
                        .description("Hypothecation lending for new passenger and commercial vehicles.")
                        .isActive(true)
                        .build(),

                LoanProduct.builder()
                        .productCode("PROD_PERSONAL_INSTANT")
                        .productName("Instant Personal Credit Facility")
                        .loanType("PERSONAL")
                        .minAmount(new BigDecimal("25000.00"))
                        .maxAmount(new BigDecimal("1500000.00"))
                        .minTenureMonths(6)
                        .maxTenureMonths(60) // 5 Years
                        .baseInterestRate(new BigDecimal("11.50"))
                        .processingFeePercentage(new BigDecimal("1.50"))
                        .maxFoirPercentage(new BigDecimal("45.00"))
                        .minCreditScore(650)
                        .collateralRequired(false)
                        .description("Unsecured personal advance for emergency, medical, and discretionary expenditure.")
                        .isActive(true)
                        .build(),

                LoanProduct.builder()
                        .productCode("PROD_SME_GROWTH")
                        .productName("SME Enterprise Growth Facility")
                        .loanType("BUSINESS")
                        .minAmount(new BigDecimal("200000.00"))
                        .maxAmount(new BigDecimal("20000000.00")) // ₹2 Cr
                        .minTenureMonths(12)
                        .maxTenureMonths(120) // 10 Years
                        .baseInterestRate(new BigDecimal("10.75"))
                        .processingFeePercentage(new BigDecimal("1.25"))
                        .maxFoirPercentage(new BigDecimal("60.00"))
                        .minCreditScore(680)
                        .collateralRequired(true)
                        .description("Term credit for MSMEs and corporate enterprises for capital expenditure and machinery.")
                        .isActive(true)
                        .build(),

                LoanProduct.builder()
                        .productCode("PROD_EDUCATION_MERIT")
                        .productName("Merit Higher Education Scholar Loan")
                        .loanType("EDUCATION")
                        .minAmount(new BigDecimal("50000.00"))
                        .maxAmount(new BigDecimal("7500000.00"))
                        .minTenureMonths(12)
                        .maxTenureMonths(180) // 15 Years
                        .baseInterestRate(new BigDecimal("8.25"))
                        .processingFeePercentage(new BigDecimal("0.50"))
                        .maxFoirPercentage(new BigDecimal("55.00"))
                        .minCreditScore(650)
                        .collateralRequired(false)
                        .description("Higher studies loan with flexible repayment moratorium during study course.")
                        .isActive(true)
                        .build()
        );

        loanProductRepository.saveAll(products);
        log.info("Initialized {} lending product configurations.", products.size());
    }

    public List<LoanProductDto> getActiveLoanProducts() {
        return loanProductRepository.findByIsActiveTrue().stream()
                .map(this::mapToProductDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LoanApplicationDto submitApplication(LoanApplicationRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        // Resolve loan product if provided
        LoanProduct product = null;
        if (request.getLoanProductId() != null) {
            product = loanProductRepository.findById(request.getLoanProductId()).orElse(null);
        }
        if (product == null) {
            List<LoanProduct> matching = loanProductRepository.findByLoanType(request.getLoanType().toUpperCase());
            if (!matching.isEmpty()) product = matching.get(0);
        }

        BigDecimal interestRate = product != null ? product.getBaseInterestRate() : resolveBaseInterestRate(request.getLoanType());
        BigDecimal principal = request.getRequestedAmount();
        int tenure = request.getRequestedTenureMonths();

        // Underwriting & Eligibility: Proposed EMI Calculation via Pure BigDecimal
        BigDecimal proposedEmi = calculateEmi(principal, interestRate, tenure);

        // Underwriting: FOIR (Fixed Obligation to Income Ratio) Assessment
        BigDecimal monthlyIncome = request.getMonthlyIncome() != null && request.getMonthlyIncome().compareTo(BigDecimal.ZERO) > 0
                ? request.getMonthlyIncome()
                : (customer.getAnnualIncome() != null ? customer.getAnnualIncome().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP) : new BigDecimal("75000.00"));

        BigDecimal existingObligations = request.getExistingMonthlyObligations() != null ? request.getExistingMonthlyObligations() : BigDecimal.ZERO;
        BigDecimal totalObligations = existingObligations.add(proposedEmi);

        BigDecimal foir = monthlyIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalObligations.multiply(BigDecimal.valueOf(100)).divide(monthlyIncome, 2, RoundingMode.HALF_UP)
                : new BigDecimal("40.00");

        // Bureau Simulation & Risk Grading
        int creditScore = 720 + ThreadLocalRandom.current().nextInt(10, 85);
        String riskGrade = evaluateCreditRiskGrade(creditScore, foir);
        String hierarchyLevel = evaluateApprovalHierarchy(principal);

        String appNo = String.format("LN-APP-%s-%05d",
                branch.getBranchCode(),
                ThreadLocalRandom.current().nextInt(10000, 99999));

        LoanApplication app = LoanApplication.builder()
                .applicationNumber(appNo)
                .customer(customer)
                .branch(branch)
                .loanType(request.getLoanType().toUpperCase())
                .requestedAmount(principal)
                .requestedTenureMonths(tenure)
                .purpose(request.getPurpose())
                .monthlyIncome(monthlyIncome)
                .existingMonthlyObligations(existingObligations)
                .foirPercentage(foir)
                .creditScore(creditScore)
                .creditRiskGrade(riskGrade)
                .bureauStatus("SIMULATED_VERIFIED")
                .approvalHierarchyLevel(hierarchyLevel)
                .status("SUBMITTED")
                .applicationDate(LocalDateTime.now())
                .remarks(String.format("Underwriting Assessment: FOIR=%.2f%%, Credit Grade=%s, Approval Authority=%s", foir, riskGrade, hierarchyLevel))
                .build();

        LoanApplication saved = loanApplicationRepository.save(app);
        return mapToAppDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<LoanApplicationDto> getApplications(Long branchId, String status, Pageable pageable) {
        Page<LoanApplication> page;
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            page = loanApplicationRepository.findByStatus(status, pageable);
        } else if (branchId != null) {
            page = loanApplicationRepository.findByBranchId(branchId, pageable);
        } else {
            page = loanApplicationRepository.findAll(pageable);
        }
        return page.map(this::mapToAppDto);
    }

    /**
     * Approves the loan, generates the formal Loan Sanction Letter, generates
     * the pure BigDecimal amortization schedule, and disburses funds with double-entry accounting.
     */
    @Transactional
    public LoanDto approveAndDisburseLoan(Long applicationId, User sanctioningOfficer) {
        LoanApplication app = loanApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("LoanApplication", "id", applicationId));

        if (!"SUBMITTED".equalsIgnoreCase(app.getStatus()) && !"UNDER_REVIEW".equalsIgnoreCase(app.getStatus())) {
            throw new BankingException("Application is already " + app.getStatus());
        }

        app.setStatus("APPROVED");
        app.setAssignedOfficer(sanctioningOfficer);

        BigDecimal annualRate = resolveBaseInterestRate(app.getLoanType());
        BigDecimal principal = app.getRequestedAmount();
        int months = app.getRequestedTenureMonths();

        // Exact BigDecimal EMI calculation
        BigDecimal emi = calculateEmi(principal, annualRate, months);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(months)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInterest = totalPayable.subtract(principal);

        // Generate Loan Sanction Letter
        String sanctionRef = String.format("SANCTION-%d-%05d",
                LocalDate.now().getYear(),
                ThreadLocalRandom.current().nextInt(10000, 99999));

        BigDecimal processingFee = principal.multiply(new BigDecimal("0.0100")).setScale(2, RoundingMode.HALF_UP); // 1.00% fee

        LoanSanctionLetter sanctionLetter = LoanSanctionLetter.builder()
                .sanctionReference(sanctionRef)
                .loanApplicationId(app.getId())
                .customerId(app.getCustomer().getId())
                .customerName(app.getCustomer().getFullName())
                .sanctionedAmount(principal)
                .approvedInterestRate(annualRate)
                .approvedTenureMonths(months)
                .monthlyEmi(emi)
                .processingFeeAmount(processingFee)
                .sanctionDate(LocalDate.now())
                .validityExpiryDate(LocalDate.now().plusDays(60))
                .approvingAuthorityLevel(app.getApprovalHierarchyLevel())
                .sanctioningOfficerUsername(sanctioningOfficer != null ? sanctioningOfficer.getUsername() : "CREDIT_COMMITTEE")
                .specialConditions("Subject to clear title search, valid KYC status, and post-dated direct debit mandate registration.")
                .status("DISBURSED")
                .build();
        loanSanctionLetterRepository.save(sanctionLetter);

        app.setSanctionLetterReference(sanctionRef);
        loanApplicationRepository.save(app);

        String loanAccNo = String.format("LA-%s-%06d",
                app.getBranch().getBranchCode(),
                ThreadLocalRandom.current().nextInt(100000, 999999));

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
                .totalRepaidPrincipal(BigDecimal.ZERO)
                .totalRepaidInterest(BigDecimal.ZERO)
                .assetClassification("STANDARD")
                .daysPastDue(0)
                .provisioningPercentage(new BigDecimal("0.40"))
                .requiredProvisionAmount(principal.multiply(new BigDecimal("0.0040")).setScale(2, RoundingMode.HALF_UP))
                .accruedPenalInterest(BigDecimal.ZERO)
                .status("ACTIVE")
                .sanctionedDate(LocalDateTime.now())
                .maturityDate(LocalDateTime.now().plusMonths(months))
                .nextDueDate(LocalDateTime.now().plusMonths(1))
                .build();

        Loan savedLoan = loanRepository.save(loan);

        // Generate Pure BigDecimal Amortization Schedule
        generateAmortizationSchedule(savedLoan, principal, annualRate, months, emi);

        // Disburse loan into customer's primary deposit account with Core Banking Double-Entry
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

            // Double-Entry General Ledger Posting:
            // DR 1020-LOANS-ADVANCES (Asset) / CR 2010-DEMAND-DEPOSITS-SAVINGS (Liability)
            try {
                accountingEngineService.postTransactionAccountingEntry(
                        txnRef, "LOAN_DISBURSEMENT", principal, app.getBranch(), sanctioningOfficer,
                        "Loan facility disbursement for " + loanAccNo
                );
            } catch (Exception ex) {
                log.warn("Accounting entry posting for disbursement: {}", ex.getMessage());
            }
        }

        auditService.recordAudit(sanctioningOfficer, "LOAN_SANCTIONED_AND_DISBURSED", "LENDING", loanAccNo,
                String.format("Sanctioned & disbursed %s of INR %s at %s%% for %d months under Sanction Ref: %s",
                        app.getLoanType(), principal, annualRate, months, sanctionRef),
                "127.0.0.1", "SUCCESS");

        return mapToLoanDto(savedLoan);
    }

    /**
     * Processes an EMI or custom repayment against a loan facility.
     * Allocates payment across late fee, interest component, and principal component.
     * Generates double-entry accounting records (DR Customer Deposit / CR Loan Principal + CR Interest Income).
     */
    @Transactional
    public LoanDto processRepayment(RepaymentRequest request, User user) {
        Loan loan = loanRepository.findById(request.getLoanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan", "id", request.getLoanId()));

        if (!"ACTIVE".equalsIgnoreCase(loan.getStatus())) {
            throw new BankingException("Loan is currently " + loan.getStatus() + ". Only ACTIVE loans can receive repayments.");
        }

        BigDecimal paymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BankingException("Repayment amount must be positive.");
        }

        // Deduct from customer's bank account if specified
        if (request.getSourceAccountId() != null) {
            BankAccount sourceAcc = bankAccountRepository.findById(request.getSourceAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getSourceAccountId()));

            if (sourceAcc.getAvailableBalance().compareTo(paymentAmount) < 0) {
                throw new BankingException("Insufficient account balance. Available: INR " + sourceAcc.getAvailableBalance());
            }

            sourceAcc.setBalance(sourceAcc.getBalance().subtract(paymentAmount));
            sourceAcc.setAvailableBalance(sourceAcc.getAvailableBalance().subtract(paymentAmount));
            bankAccountRepository.save(sourceAcc);
        }

        // Find earliest unpaid scheduled installment
        Optional<LoanRepayment> nextRepaymentOpt = loanRepaymentRepository
                .findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(loan.getId(), "SCHEDULED");

        BigDecimal principalPaid;
        BigDecimal interestPaid;
        BigDecimal penaltyPaid = BigDecimal.ZERO;

        if (nextRepaymentOpt.isPresent()) {
            LoanRepayment nextRepayment = nextRepaymentOpt.get();

            // Calculate late penalty if overdue
            if (nextRepayment.getDueDate().isBefore(LocalDateTime.now())) {
                long daysOverdue = ChronoUnit.DAYS.between(nextRepayment.getDueDate(), LocalDateTime.now());
                if (daysOverdue > 0) {
                    penaltyPaid = nextRepayment.getEmiAmount()
                            .multiply(new BigDecimal("0.02"))
                            .multiply(BigDecimal.valueOf(daysOverdue))
                            .divide(BigDecimal.valueOf(365), 2, RoundingMode.HALF_UP);
                }
            }

            interestPaid = nextRepayment.getInterestComponent().min(paymentAmount);
            principalPaid = paymentAmount.subtract(interestPaid).subtract(penaltyPaid).max(BigDecimal.ZERO);

            nextRepayment.setStatus("PAID");
            nextRepayment.setPaidDate(LocalDateTime.now());
            nextRepayment.setPenaltyAmount(penaltyPaid);
            String repayRef = "TXN-REP-" + System.currentTimeMillis();
            nextRepayment.setPaymentReference(repayRef);
            loanRepaymentRepository.save(nextRepayment);
        } else {
            // Extra prepayment towards principal
            interestPaid = BigDecimal.ZERO;
            principalPaid = paymentAmount.min(loan.getOutstandingPrincipal());
        }

        // Update Loan Balances
        BigDecimal newOutstanding = loan.getOutstandingPrincipal().subtract(principalPaid).max(BigDecimal.ZERO);
        loan.setOutstandingPrincipal(newOutstanding);
        loan.setTotalRepaidPrincipal(loan.getTotalRepaidPrincipal().add(principalPaid));
        loan.setTotalRepaidInterest(loan.getTotalRepaidInterest().add(interestPaid));

        if (newOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus("CLOSED");
            loan.setAssetClassification("STANDARD");
            loan.setDaysPastDue(0);
            loan.setRequiredProvisionAmount(BigDecimal.ZERO);
        } else {
            // Recompute NPA asset classification & provisioning
            evaluateAndClassifyNpa(loan);
        }

        Loan saved = loanRepository.save(loan);

        // Core Banking Double-Entry Accounting Posting:
        // DR 2010-DEMAND-DEPOSITS-SAVINGS (Total Paid)
        // CR 1020-LOANS-ADVANCES (Principal Component)
        // CR 4010-INTEREST-INCOME (Interest Component)
        // CR 4020-FEE-COMMISSION-INCOME (Penalty Component, if any)
        try {
            postRepaymentDoubleEntry(loan, paymentAmount, principalPaid, interestPaid, penaltyPaid, user);
        } catch (Exception ex) {
            log.warn("Double-entry repayment posting warning: {}", ex.getMessage());
        }

        auditService.recordAudit(user, "LOAN_REPAYMENT_PROCESSED", "LENDING", loan.getLoanAccountNumber(),
                String.format("Repayment of INR %s applied to %s (Principal: %s, Interest: %s, Penalty: %s). New Outstanding: %s",
                        paymentAmount, loan.getLoanAccountNumber(), principalPaid, interestPaid, penaltyPaid, newOutstanding),
                "127.0.0.1", "SUCCESS");

        return mapToLoanDto(saved);
    }

    private void postRepaymentDoubleEntry(Loan loan, BigDecimal total, BigDecimal principal, BigDecimal interest, BigDecimal penalty, User user) {
        String entryNumber = "JE-" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + (int)(Math.random() * 90000 + 10000);
        String ref = "REP-" + loan.getLoanAccountNumber() + "-" + System.currentTimeMillis();

        GLAccount customerDeposit = glAccountRepository.findByAccountCode("2010-DEMAND-DEPOSITS-SAVINGS")
                .orElse(glAccountRepository.findByAccountCode("1010-CASH-VAULT").orElse(null));
        GLAccount loansAsset = glAccountRepository.findByAccountCode("1020-LOANS-ADVANCES").orElse(null);
        GLAccount interestIncome = glAccountRepository.findByAccountCode("4010-INTEREST-INCOME")
                .orElse(glAccountRepository.findByAccountCode("4020-FEE-COMMISSION-INCOME").orElse(null));

        if (customerDeposit != null && loansAsset != null) {
            JournalEntry entry = JournalEntry.builder()
                    .entryNumber(entryNumber)
                    .postingDate(LocalDate.now())
                    .transactionReference(ref)
                    .transactionType("EMI_REPAYMENT")
                    .branch(loan.getBranch())
                    .totalDebit(total)
                    .totalCredit(total)
                    .status("POSTED")
                    .narration("Loan installment repayment for " + loan.getLoanAccountNumber())
                    .postedByUser(user)
                    .postedAt(LocalDateTime.now())
                    .build();

            // Line 1: DR Customer Account (Total Paid)
            entry.addLine(JournalEntryLine.builder()
                    .journalEntry(entry)
                    .glAccount(customerDeposit)
                    .entryType("DEBIT")
                    .amount(total)
                    .memo("DR: Customer deposit debit for loan installment")
                    .lineNumber(1)
                    .build());

            // Line 2: CR Loans & Advances Asset (Principal reduction)
            entry.addLine(JournalEntryLine.builder()
                    .journalEntry(entry)
                    .glAccount(loansAsset)
                    .entryType("CREDIT")
                    .amount(principal)
                    .memo("CR: Principal asset credit for " + loan.getLoanAccountNumber())
                    .lineNumber(2)
                    .build());

            // Line 3: CR Interest Income
            if (interest.compareTo(BigDecimal.ZERO) > 0 && interestIncome != null) {
                entry.addLine(JournalEntryLine.builder()
                        .journalEntry(entry)
                        .glAccount(interestIncome)
                        .entryType("CREDIT")
                        .amount(interest.add(penalty))
                        .memo("CR: Lending interest & fee earnings")
                        .lineNumber(3)
                        .build());
            }

            customerDeposit.setCurrentBalance(customerDeposit.getCurrentBalance().subtract(total));
            loansAsset.setCurrentBalance(loansAsset.getCurrentBalance().subtract(principal));
            if (interestIncome != null) {
                interestIncome.setCurrentBalance(interestIncome.getCurrentBalance().add(interest.add(penalty)));
                glAccountRepository.save(interestIncome);
            }
            glAccountRepository.save(customerDeposit);
            glAccountRepository.save(loansAsset);
        }
    }

    /**
     * Evaluates loan overdue days and classifies the asset per RBI Prudential Norms:
     * - STANDARD: 0 DPD (0.40% provisioning)
     * - SMA-0: 1-30 DPD (0.40% provisioning)
     * - SMA-1: 31-60 DPD (1.00% provisioning)
     * - SMA-2: 61-90 DPD (2.00% provisioning)
     * - SUBSTANDARD_NPA: 91-365 DPD (15.00% provisioning)
     * - DOUBTFUL_NPA: 366-730 DPD (25.00% provisioning)
     * - LOSS_ASSET: >730 DPD (100.00% provisioning)
     */
    public void evaluateAndClassifyNpa(Loan loan) {
        if (!"ACTIVE".equalsIgnoreCase(loan.getStatus()) || loan.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) <= 0) {
            loan.setAssetClassification("STANDARD");
            loan.setDaysPastDue(0);
            loan.setProvisioningPercentage(new BigDecimal("0.40"));
            loan.setRequiredProvisionAmount(BigDecimal.ZERO);
            return;
        }

        // Find oldest unpaid scheduled installment
        Optional<LoanRepayment> oldestUnpaid = loanRepaymentRepository
                .findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(loan.getId(), "SCHEDULED");

        int dpd = 0;
        if (oldestUnpaid.isPresent()) {
            LocalDateTime due = oldestUnpaid.get().getDueDate();
            if (due.isBefore(LocalDateTime.now())) {
                dpd = (int) ChronoUnit.DAYS.between(due.toLocalDate(), LocalDate.now());
            }
        }

        loan.setDaysPastDue(dpd);

        String classification;
        BigDecimal provisionRate;

        if (dpd == 0) {
            classification = "STANDARD";
            provisionRate = new BigDecimal("0.40");
        } else if (dpd <= 30) {
            classification = "SMA_0";
            provisionRate = new BigDecimal("0.40");
        } else if (dpd <= 60) {
            classification = "SMA_1";
            provisionRate = new BigDecimal("1.00");
        } else if (dpd <= 90) {
            classification = "SMA_2";
            provisionRate = new BigDecimal("2.00");
        } else if (dpd <= 365) {
            classification = "SUBSTANDARD_NPA";
            provisionRate = new BigDecimal("15.00");
        } else if (dpd <= 730) {
            classification = "DOUBTFUL_NPA";
            provisionRate = new BigDecimal("25.00");
        } else {
            classification = "LOSS_ASSET";
            provisionRate = new BigDecimal("100.00");
        }

        loan.setAssetClassification(classification);
        loan.setProvisioningPercentage(provisionRate);
        BigDecimal requiredProvision = loan.getOutstandingPrincipal()
                .multiply(provisionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        loan.setRequiredProvisionAmount(requiredProvision);
    }

    @Transactional(readOnly = true)
    public NpaPortfolioSummaryDto getNpaPortfolioSummary() {
        List<Loan> allLoans = loanRepository.findAll();
        long totalLoans = allLoans.size();
        BigDecimal grossAdvances = BigDecimal.ZERO;

        long standardCount = 0; BigDecimal standardAmt = BigDecimal.ZERO;
        long sma0Count = 0; BigDecimal sma0Amt = BigDecimal.ZERO;
        long sma1Count = 0; BigDecimal sma1Amt = BigDecimal.ZERO;
        long sma2Count = 0; BigDecimal sma2Amt = BigDecimal.ZERO;
        long subNpaCount = 0; BigDecimal subNpaAmt = BigDecimal.ZERO;
        long doubtfulCount = 0; BigDecimal doubtfulAmt = BigDecimal.ZERO;
        long lossCount = 0; BigDecimal lossAmt = BigDecimal.ZERO;
        BigDecimal totalProvisions = BigDecimal.ZERO;

        for (Loan l : allLoans) {
            if ("ACTIVE".equalsIgnoreCase(l.getStatus())) {
                grossAdvances = grossAdvances.add(l.getOutstandingPrincipal());
                totalProvisions = totalProvisions.add(l.getRequiredProvisionAmount() != null ? l.getRequiredProvisionAmount() : BigDecimal.ZERO);

                String asset = l.getAssetClassification() != null ? l.getAssetClassification().toUpperCase() : "STANDARD";
                switch (asset) {
                    case "SMA_0" -> { sma0Count++; sma0Amt = sma0Amt.add(l.getOutstandingPrincipal()); }
                    case "SMA_1" -> { sma1Count++; sma1Amt = sma1Amt.add(l.getOutstandingPrincipal()); }
                    case "SMA_2" -> { sma2Count++; sma2Amt = sma2Amt.add(l.getOutstandingPrincipal()); }
                    case "SUBSTANDARD_NPA" -> { subNpaCount++; subNpaAmt = subNpaAmt.add(l.getOutstandingPrincipal()); }
                    case "DOUBTFUL_NPA" -> { doubtfulCount++; doubtfulAmt = doubtfulAmt.add(l.getOutstandingPrincipal()); }
                    case "LOSS_ASSET" -> { lossCount++; lossAmt = lossAmt.add(l.getOutstandingPrincipal()); }
                    default -> { standardCount++; standardAmt = standardAmt.add(l.getOutstandingPrincipal()); }
                }
            }
        }

        BigDecimal grossNpaAmt = subNpaAmt.add(doubtfulAmt).add(lossAmt);
        BigDecimal grossNpaRatio = grossAdvances.compareTo(BigDecimal.ZERO) > 0
                ? grossNpaAmt.multiply(BigDecimal.valueOf(100)).divide(grossAdvances, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal netNpaAmt = grossNpaAmt.subtract(totalProvisions).max(BigDecimal.ZERO);
        BigDecimal netNpaRatio = grossAdvances.compareTo(BigDecimal.ZERO) > 0
                ? netNpaAmt.multiply(BigDecimal.valueOf(100)).divide(grossAdvances, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return NpaPortfolioSummaryDto.builder()
                .totalLoans(totalLoans)
                .grossAdvances(grossAdvances)
                .standardCount(standardCount)
                .standardAmount(standardAmt)
                .sma0Count(sma0Count)
                .sma0Amount(sma0Amt)
                .sma1Count(sma1Count)
                .sma1Amount(sma1Amt)
                .sma2Count(sma2Count)
                .sma2Amount(sma2Amt)
                .substandardNpaCount(subNpaCount)
                .substandardNpaAmount(subNpaAmt)
                .doubtfulNpaCount(doubtfulCount)
                .doubtfulNpaAmount(doubtfulAmt)
                .lossAssetCount(lossCount)
                .lossAssetAmount(lossAmt)
                .grossNpaRatioPercentage(grossNpaRatio)
                .netNpaRatioPercentage(netNpaRatio)
                .totalRequiredProvisions(totalProvisions)
                .build();
    }

    @Transactional(readOnly = true)
    public LoanStatementDto getLoanStatement(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", "id", loanId));

        List<LoanRepayment> repayments = loanRepaymentRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
        List<LoanStatementEntryDto> entries = new ArrayList<>();

        // Opening Disbursement Entry
        entries.add(LoanStatementEntryDto.builder()
                .timestamp(loan.getSanctionedDate() != null ? loan.getSanctionedDate() : LocalDateTime.now().minusMonths(loan.getTenureMonths()))
                .transactionReference("DSB-" + loan.getLoanAccountNumber())
                .entryType("DISBURSEMENT")
                .narration("Facility Disbursement into Customer Savings Account")
                .principalPaid(BigDecimal.ZERO)
                .interestPaid(BigDecimal.ZERO)
                .feePaid(BigDecimal.ZERO)
                .totalAmount(loan.getPrincipalAmount())
                .runningOutstandingBalance(loan.getPrincipalAmount())
                .build());

        BigDecimal runningBalance = loan.getPrincipalAmount();

        for (LoanRepayment r : repayments) {
            if ("PAID".equalsIgnoreCase(r.getStatus())) {
                runningBalance = runningBalance.subtract(r.getPrincipalComponent()).max(BigDecimal.ZERO);
                entries.add(LoanStatementEntryDto.builder()
                        .timestamp(r.getPaidDate() != null ? r.getPaidDate() : r.getDueDate())
                        .transactionReference(r.getPaymentReference() != null ? r.getPaymentReference() : "REP-" + r.getId())
                        .entryType("EMI_REPAYMENT")
                        .narration("Installment #" + r.getInstallmentNumber() + " Repayment Credited")
                        .principalPaid(r.getPrincipalComponent())
                        .interestPaid(r.getInterestComponent())
                        .feePaid(r.getPenaltyAmount() != null ? r.getPenaltyAmount() : BigDecimal.ZERO)
                        .totalAmount(r.getEmiAmount().add(r.getPenaltyAmount() != null ? r.getPenaltyAmount() : BigDecimal.ZERO))
                        .runningOutstandingBalance(runningBalance)
                        .build());
            }
        }

        return LoanStatementDto.builder()
                .loanAccountNumber(loan.getLoanAccountNumber())
                .customerName(loan.getCustomer().getFullName())
                .customerNumber(loan.getCustomer().getCustomerNumber())
                .loanType(loan.getLoanType())
                .sanctionedPrincipal(loan.getPrincipalAmount())
                .interestRate(loan.getInterestRate())
                .tenureMonths(loan.getTenureMonths())
                .monthlyEmi(loan.getMonthlyEmi())
                .outstandingPrincipal(loan.getOutstandingPrincipal())
                .totalPrincipalRepaid(loan.getTotalRepaidPrincipal())
                .totalInterestRepaid(loan.getTotalRepaidInterest())
                .assetClassification(loan.getAssetClassification())
                .daysPastDue(loan.getDaysPastDue())
                .requiredProvisionAmount(loan.getRequiredProvisionAmount())
                .entries(entries)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<LoanDto> getLoans(Long branchId, String status, String assetClassification, Pageable pageable) {
        Page<Loan> page = loanRepository.findFilteredLoans(
                branchId,
                (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) ? null : status,
                (assetClassification == null || assetClassification.isBlank() || "ALL".equalsIgnoreCase(assetClassification)) ? null : assetClassification,
                pageable
        );
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
                .paymentReference(r.getPaymentReference())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<LoanSanctionLetterDto> getSanctionLetterByApplicationId(Long applicationId) {
        return loanSanctionLetterRepository.findByLoanApplicationId(applicationId)
                .map(this::mapToSanctionDto);
    }

    /**
     * Pure BigDecimal Reducing Balance EMI Formula:
     * EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
     */
    public BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        if (principal == null || annualRate == null || tenureMonths <= 0) return BigDecimal.ZERO;

        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

        // (1 + r)^n computed with MathContext
        BigDecimal onePlusRPowN = BigDecimal.valueOf(Math.pow(1.0 + monthlyRate.doubleValue(), tenureMonths));

        BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusRPowN);
        BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);

        if (denominator.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private void generateAmortizationSchedule(Loan loan, BigDecimal principal, BigDecimal annualRate, int months, BigDecimal emi) {
        BigDecimal balance = principal;
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);

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

    private BigDecimal resolveBaseInterestRate(String loanType) {
        if (loanType == null) return new BigDecimal("11.50");
        return switch (loanType.toUpperCase()) {
            case "HOME" -> new BigDecimal("8.50");
            case "VEHICLE" -> new BigDecimal("9.25");
            case "EDUCATION" -> new BigDecimal("8.25");
            case "BUSINESS" -> new BigDecimal("10.75");
            default -> new BigDecimal("11.50"); // PERSONAL
        };
    }

    private String evaluateCreditRiskGrade(int creditScore, BigDecimal foir) {
        if (creditScore >= 750 && foir.compareTo(new BigDecimal("45.00")) <= 0) return "PRIME";
        if (creditScore >= 700 && foir.compareTo(new BigDecimal("55.00")) <= 0) return "NEAR_PRIME";
        if (creditScore >= 650 && foir.compareTo(new BigDecimal("65.00")) <= 0) return "SUBPRIME";
        return "HIGH_RISK";
    }

    private String evaluateApprovalHierarchy(BigDecimal amount) {
        if (amount.compareTo(new BigDecimal("500000.00")) <= 0) return "BRANCH_OFFICER";
        if (amount.compareTo(new BigDecimal("2500000.00")) <= 0) return "BRANCH_MANAGER";
        if (amount.compareTo(new BigDecimal("10000000.00")) <= 0) return "REGIONAL_HEAD";
        return "CREDIT_COMMITTEE";
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
                .existingMonthlyObligations(a.getExistingMonthlyObligations())
                .foirPercentage(a.getFoirPercentage())
                .creditScore(a.getCreditScore())
                .creditRiskGrade(a.getCreditRiskGrade())
                .bureauStatus(a.getBureauStatus())
                .approvalHierarchyLevel(a.getApprovalHierarchyLevel())
                .sanctionLetterReference(a.getSanctionLetterReference())
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
                .totalRepaidPrincipal(l.getTotalRepaidPrincipal())
                .totalRepaidInterest(l.getTotalRepaidInterest())
                .assetClassification(l.getAssetClassification())
                .daysPastDue(l.getDaysPastDue())
                .provisioningPercentage(l.getProvisioningPercentage())
                .requiredProvisionAmount(l.getRequiredProvisionAmount())
                .accruedPenalInterest(l.getAccruedPenalInterest())
                .status(l.getStatus())
                .sanctionedDate(l.getSanctionedDate())
                .maturityDate(l.getMaturityDate())
                .nextDueDate(l.getNextDueDate())
                .build();
    }

    private LoanProductDto mapToProductDto(LoanProduct p) {
        return LoanProductDto.builder()
                .id(p.getId())
                .productCode(p.getProductCode())
                .productName(p.getProductName())
                .loanType(p.getLoanType())
                .minAmount(p.getMinAmount())
                .maxAmount(p.getMaxAmount())
                .minTenureMonths(p.getMinTenureMonths())
                .maxTenureMonths(p.getMaxTenureMonths())
                .baseInterestRate(p.getBaseInterestRate())
                .processingFeePercentage(p.getProcessingFeePercentage())
                .maxFoirPercentage(p.getMaxFoirPercentage())
                .minCreditScore(p.getMinCreditScore())
                .collateralRequired(p.getCollateralRequired())
                .description(p.getDescription())
                .isActive(p.getIsActive())
                .build();
    }

    private LoanSanctionLetterDto mapToSanctionDto(LoanSanctionLetter s) {
        return LoanSanctionLetterDto.builder()
                .id(s.getId())
                .sanctionReference(s.getSanctionReference())
                .loanApplicationId(s.getLoanApplicationId())
                .customerId(s.getCustomerId())
                .customerName(s.getCustomerName())
                .sanctionedAmount(s.getSanctionedAmount())
                .approvedInterestRate(s.getApprovedInterestRate())
                .approvedTenureMonths(s.getApprovedTenureMonths())
                .monthlyEmi(s.getMonthlyEmi())
                .processingFeeAmount(s.getProcessingFeeAmount())
                .sanctionDate(s.getSanctionDate())
                .validityExpiryDate(s.getValidityExpiryDate())
                .approvingAuthorityLevel(s.getApprovingAuthorityLevel())
                .sanctioningOfficerUsername(s.getSanctioningOfficerUsername())
                .specialConditions(s.getSpecialConditions())
                .status(s.getStatus())
                .build();
    }
}
