package com.apexbank;

import com.apexbank.dto.loan.*;
import com.apexbank.entity.*;
import com.apexbank.entity.loan.LoanProduct;
import com.apexbank.entity.loan.LoanSanctionLetter;
import com.apexbank.repository.*;
import com.apexbank.repository.loan.LoanProductRepository;
import com.apexbank.repository.loan.LoanSanctionLetterRepository;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import com.apexbank.service.LoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AdvancedLoanServicingTest {

    @Mock private LoanApplicationRepository loanApplicationRepository;
    @Mock private LoanRepository loanRepository;
    @Mock private LoanRepaymentRepository loanRepaymentRepository;
    @Mock private LoanProductRepository loanProductRepository;
    @Mock private LoanSanctionLetterRepository loanSanctionLetterRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private TransactionLedgerEntryRepository ledgerEntryRepository;
    @Mock private AuditService auditService;
    @Mock private AccountingEngineService accountingEngineService;
    @Mock private GLAccountRepository glAccountRepository;

    private LoanService loanService;

    private Customer testCustomer;
    private Branch testBranch;
    private BankAccount testAccount;
    private LoanProduct homeLoanProduct;
    private User creditOfficer;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        loanService = new LoanService(
                loanApplicationRepository,
                loanRepository,
                loanRepaymentRepository,
                loanProductRepository,
                loanSanctionLetterRepository,
                customerRepository,
                branchRepository,
                bankAccountRepository,
                transactionRepository,
                ledgerEntryRepository,
                auditService,
                accountingEngineService,
                glAccountRepository
        );

        testBranch = Branch.builder()
                .id(1L)
                .branchCode("BLR-001")
                .name("Bangalore Central")
                .cashVaultBalance(new BigDecimal("10000000.00"))
                .build();

        testCustomer = Customer.builder()
                .id(101L)
                .customerNumber("CIF-100234")
                .fullName("Sunil Gavaskar")
                .annualIncome(new BigDecimal("1200000.00")) // ₹12 Lakhs annual / ₹1L monthly
                .riskCategory("LOW")
                .build();

        testAccount = BankAccount.builder()
                .id(201L)
                .accountNumber("1000200030004001")
                .customer(testCustomer)
                .branch(testBranch)
                .balance(new BigDecimal("500000.00"))
                .availableBalance(new BigDecimal("500000.00"))
                .currency("INR")
                .build();

        homeLoanProduct = LoanProduct.builder()
                .id(10L)
                .productCode("PROD_HOME_PRIME")
                .productName("Prime Residential Home Loan")
                .loanType("HOME")
                .minAmount(new BigDecimal("500000.00"))
                .maxAmount(new BigDecimal("50000000.00"))
                .minTenureMonths(12)
                .maxTenureMonths(360)
                .baseInterestRate(new BigDecimal("8.50"))
                .processingFeePercentage(new BigDecimal("0.50"))
                .maxFoirPercentage(new BigDecimal("50.00"))
                .minCreditScore(700)
                .collateralRequired(true)
                .isActive(true)
                .build();

        creditOfficer = User.builder()
                .id(1L)
                .username("ananya.credit")
                .fullName("Ananya Credit Officer")
                .build();
    }

    @Test
    @DisplayName("Underwriting: FOIR calculation, credit grading, and approval hierarchy assignment")
    void testLoanApplicationUnderwriting_FoirAndRiskGrading() {
        when(customerRepository.findById(101L)).thenReturn(Optional.of(testCustomer));
        when(branchRepository.findById(1L)).thenReturn(Optional.of(testBranch));
        when(loanProductRepository.findByLoanType("HOME")).thenReturn(List.of(homeLoanProduct));
        when(loanApplicationRepository.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        LoanApplicationRequest request = LoanApplicationRequest.builder()
                .customerId(101L)
                .branchId(1L)
                .loanType("HOME")
                .requestedAmount(new BigDecimal("3000000.00")) // ₹30 Lakhs
                .requestedTenureMonths(240) // 20 Years
                .monthlyIncome(new BigDecimal("100000.00")) // ₹1,00,000 monthly
                .existingMonthlyObligations(new BigDecimal("10000.00")) // ₹10,000 existing
                .purpose("Purchase of Ready Apartment in Whitefield")
                .build();

        LoanApplicationDto appDto = loanService.submitApplication(request);

        assertNotNull(appDto);
        assertNotNull(appDto.getApplicationNumber());
        assertTrue(appDto.getApplicationNumber().startsWith("LN-APP-BLR-001-"));
        assertEquals("HOME", appDto.getLoanType());
        assertNotNull(appDto.getFoirPercentage());
        assertTrue(appDto.getFoirPercentage().compareTo(BigDecimal.ZERO) > 0);
        assertEquals("REGIONAL_HEAD", appDto.getApprovalHierarchyLevel()); // ₹30L is between ₹25L and ₹1Cr
        assertEquals("SIMULATED_VERIFIED", appDto.getBureauStatus());
        assertNotNull(appDto.getCreditRiskGrade());
    }

    @Test
    @DisplayName("Amortization: Pure BigDecimal reducing balance EMI formula produces exact figures")
    void testPureBigDecimalAmortization_ZeroPrecisionError() {
        BigDecimal principal = new BigDecimal("1000000.00"); // ₹10 Lakhs
        BigDecimal annualRate = new BigDecimal("8.50"); // 8.50%
        int tenure = 120; // 10 Years (120 Months)

        BigDecimal emi = loanService.calculateEmi(principal, annualRate, tenure);

        // Expected standard reducing balance EMI for ₹10L @ 8.50% for 120m is ~₹12,398.57
        assertNotNull(emi);
        assertTrue(emi.compareTo(new BigDecimal("12390.00")) > 0);
        assertTrue(emi.compareTo(new BigDecimal("12410.00")) < 0);
        assertEquals(2, emi.scale());
    }

    @Test
    @DisplayName("Loan Origination: Issues Sanction Letter, generates schedule, and disburses via GL accounting")
    void testLoanApproval_GeneratesSanctionLetterAndDisbursement() {
        LoanApplication app = LoanApplication.builder()
                .id(55L)
                .applicationNumber("LN-APP-BLR-001-98765")
                .customer(testCustomer)
                .branch(testBranch)
                .loanType("HOME")
                .requestedAmount(new BigDecimal("500000.00")) // ₹5 Lakhs
                .requestedTenureMonths(60) // 5 Years
                .monthlyIncome(new BigDecimal("80000.00"))
                .existingMonthlyObligations(BigDecimal.ZERO)
                .creditScore(760)
                .approvalHierarchyLevel("BRANCH_MANAGER")
                .status("SUBMITTED")
                .applicationDate(LocalDateTime.now())
                .build();

        when(loanApplicationRepository.findById(55L)).thenReturn(Optional.of(app));
        when(loanApplicationRepository.save(any(LoanApplication.class))).thenAnswer(inv -> inv.getArgument(0));
        when(loanSanctionLetterRepository.save(any(LoanSanctionLetter.class))).thenAnswer(inv -> inv.getArgument(0));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> {
            Loan l = inv.getArgument(0);
            l.setId(88L);
            return l;
        });
        when(bankAccountRepository.findByCustomerId(101L)).thenReturn(List.of(testAccount));

        LoanDto loanDto = loanService.approveAndDisburseLoan(55L, creditOfficer);

        assertNotNull(loanDto);
        assertEquals("ACTIVE", loanDto.getStatus());
        assertEquals("STANDARD", loanDto.getAssetClassification());
        assertEquals(0, loanDto.getDaysPastDue());
        assertEquals(new BigDecimal("500000.00"), loanDto.getPrincipalAmount());

        // Verify Loan Sanction Letter was saved
        verify(loanSanctionLetterRepository, times(1)).save(any(LoanSanctionLetter.class));

        // Verify Customer account was credited (balance increased from ₹5L to ₹10L)
        assertEquals(new BigDecimal("1000000.00"), testAccount.getBalance());

        // Verify 60 EMI installments were generated in repayment schedule
        verify(loanRepaymentRepository, times(60)).save(any(LoanRepayment.class));

        // Verify GL Double-Entry Posting was triggered
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                anyString(), eq("LOAN_DISBURSEMENT"), eq(new BigDecimal("500000.00")), eq(testBranch), eq(creditOfficer), anyString());
    }

    @Test
    @DisplayName("Repayment: Principal and interest allocation reduces outstanding balance")
    void testLoanRepaymentProcessing_SplitAllocation() {
        Loan loan = Loan.builder()
                .id(88L)
                .loanAccountNumber("LA-BLR-001-100234")
                .customer(testCustomer)
                .branch(testBranch)
                .loanType("HOME")
                .principalAmount(new BigDecimal("500000.00"))
                .interestRate(new BigDecimal("8.50"))
                .tenureMonths(60)
                .monthlyEmi(new BigDecimal("10258.00"))
                .outstandingPrincipal(new BigDecimal("500000.00"))
                .totalRepaidPrincipal(BigDecimal.ZERO)
                .totalRepaidInterest(BigDecimal.ZERO)
                .status("ACTIVE")
                .assetClassification("STANDARD")
                .daysPastDue(0)
                .build();

        LoanRepayment installment1 = LoanRepayment.builder()
                .id(1L)
                .loan(loan)
                .installmentNumber(1)
                .emiAmount(new BigDecimal("10258.00"))
                .principalComponent(new BigDecimal("6716.00"))
                .interestComponent(new BigDecimal("3542.00"))
                .dueDate(LocalDateTime.now().plusDays(10))
                .status("SCHEDULED")
                .penaltyAmount(BigDecimal.ZERO)
                .build();

        when(loanRepository.findById(88L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bankAccountRepository.findById(201L)).thenReturn(Optional.of(testAccount));
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(installment1));
        when(loanRepaymentRepository.save(any(LoanRepayment.class))).thenAnswer(inv -> inv.getArgument(0));

        RepaymentRequest req = RepaymentRequest.builder()
                .loanId(88L)
                .amount(new BigDecimal("10258.00"))
                .sourceAccountId(201L)
                .paymentMethod("ACCOUNT_DEBIT")
                .build();

        LoanDto updated = loanService.processRepayment(req, creditOfficer);

        // Principal should be reduced: 500,000 - 6,716 = 493,284
        assertEquals(new BigDecimal("493284.00"), updated.getOutstandingPrincipal());
        assertEquals(new BigDecimal("6716.00"), updated.getTotalRepaidPrincipal());
        assertEquals(new BigDecimal("3542.00"), updated.getTotalRepaidInterest());
        assertEquals("PAID", installment1.getStatus());
        assertNotNull(installment1.getPaidDate());

        // Account balance should decrease by ₹10,258
        assertEquals(new BigDecimal("489742.00"), testAccount.getBalance());
    }

    @Test
    @DisplayName("NPA Classification: Regulatory grading from Standard to SMA-0, SMA-1, SMA-2, and Substandard NPA")
    void testNpaClassificationAndProvisioning_SmaAndSubstandard() {
        Loan loan = Loan.builder()
                .id(88L)
                .status("ACTIVE")
                .outstandingPrincipal(new BigDecimal("500000.00"))
                .build();

        // Case 1: 0 DPD -> STANDARD (0.40% provisioning = ₹2,000)
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(LoanRepayment.builder().dueDate(LocalDateTime.now().plusDays(5)).build()));

        loanService.evaluateAndClassifyNpa(loan);
        assertEquals("STANDARD", loan.getAssetClassification());
        assertEquals(new BigDecimal("0.40"), loan.getProvisioningPercentage());
        assertEquals(new BigDecimal("2000.00"), loan.getRequiredProvisionAmount());

        // Case 2: 25 DPD -> SMA_0 (0.40% provisioning)
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(LoanRepayment.builder().dueDate(LocalDateTime.now().minusDays(25)).build()));

        loanService.evaluateAndClassifyNpa(loan);
        assertEquals("SMA_0", loan.getAssetClassification());
        assertEquals(25, loan.getDaysPastDue());

        // Case 3: 45 DPD -> SMA_1 (1.00% provisioning = ₹5,000)
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(LoanRepayment.builder().dueDate(LocalDateTime.now().minusDays(45)).build()));

        loanService.evaluateAndClassifyNpa(loan);
        assertEquals("SMA_1", loan.getAssetClassification());
        assertEquals(new BigDecimal("1.00"), loan.getProvisioningPercentage());
        assertEquals(new BigDecimal("5000.00"), loan.getRequiredProvisionAmount());

        // Case 4: 75 DPD -> SMA_2 (2.00% provisioning = ₹10,000)
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(LoanRepayment.builder().dueDate(LocalDateTime.now().minusDays(75)).build()));

        loanService.evaluateAndClassifyNpa(loan);
        assertEquals("SMA_2", loan.getAssetClassification());
        assertEquals(new BigDecimal("2.00"), loan.getProvisioningPercentage());
        assertEquals(new BigDecimal("10000.00"), loan.getRequiredProvisionAmount());

        // Case 5: 120 DPD (> 90 days) -> SUBSTANDARD_NPA (15.00% provisioning = ₹75,000)
        when(loanRepaymentRepository.findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(88L, "SCHEDULED"))
                .thenReturn(Optional.of(LoanRepayment.builder().dueDate(LocalDateTime.now().minusDays(120)).build()));

        loanService.evaluateAndClassifyNpa(loan);
        assertEquals("SUBSTANDARD_NPA", loan.getAssetClassification());
        assertEquals(new BigDecimal("15.00"), loan.getProvisioningPercentage());
        assertEquals(new BigDecimal("75000.00"), loan.getRequiredProvisionAmount());
    }

    @Test
    @DisplayName("Loan Statement: Generates complete audit ledger from facility origination through repayments")
    void testLoanStatementGeneration() {
        Loan loan = Loan.builder()
                .id(88L)
                .loanAccountNumber("LA-BLR-001-100234")
                .customer(testCustomer)
                .principalAmount(new BigDecimal("500000.00"))
                .interestRate(new BigDecimal("8.50"))
                .tenureMonths(60)
                .monthlyEmi(new BigDecimal("10258.00"))
                .outstandingPrincipal(new BigDecimal("493284.00"))
                .totalRepaidPrincipal(new BigDecimal("6716.00"))
                .totalRepaidInterest(new BigDecimal("3542.00"))
                .status("ACTIVE")
                .assetClassification("STANDARD")
                .daysPastDue(0)
                .sanctionedDate(LocalDateTime.now().minusMonths(1))
                .build();

        LoanRepayment paidInstallment = LoanRepayment.builder()
                .installmentNumber(1)
                .emiAmount(new BigDecimal("10258.00"))
                .principalComponent(new BigDecimal("6716.00"))
                .interestComponent(new BigDecimal("3542.00"))
                .status("PAID")
                .paidDate(LocalDateTime.now().minusDays(5))
                .paymentReference("TXN-REP-001")
                .build();

        when(loanRepository.findById(88L)).thenReturn(Optional.of(loan));
        when(loanRepaymentRepository.findByLoanIdOrderByInstallmentNumberAsc(88L)).thenReturn(List.of(paidInstallment));

        LoanStatementDto statement = loanService.getLoanStatement(88L);

        assertNotNull(statement);
        assertEquals("LA-BLR-001-100234", statement.getLoanAccountNumber());
        assertEquals(2, statement.getEntries().size()); // 1 Disbursement + 1 Paid installment
        assertEquals("DISBURSEMENT", statement.getEntries().get(0).getEntryType());
        assertEquals("EMI_REPAYMENT", statement.getEntries().get(1).getEntryType());
        assertEquals(new BigDecimal("493284.00"), statement.getEntries().get(1).getRunningOutstandingBalance());
    }
}
