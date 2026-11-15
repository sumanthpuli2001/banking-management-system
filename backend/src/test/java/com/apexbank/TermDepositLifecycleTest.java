package com.apexbank;

import com.apexbank.dto.deposit.*;
import com.apexbank.entity.*;
import com.apexbank.entity.deposit.DepositProductConfig;
import com.apexbank.repository.*;
import com.apexbank.repository.deposit.DepositProductConfigRepository;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import com.apexbank.service.FixedDepositService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TermDepositLifecycleTest {

    @Mock
    private FixedDepositRepository fixedDepositRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private TransactionLedgerEntryRepository ledgerEntryRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private AccountingEngineService accountingEngineService;

    @Mock
    private DepositProductConfigRepository depositProductConfigRepository;

    private FixedDepositService fixedDepositService;

    private Customer testCustomer;
    private Branch testBranch;
    private BankAccount testAccount;
    private User testUser;

    @BeforeEach
    void setUp() {
        fixedDepositService = new FixedDepositService(
                fixedDepositRepository,
                bankAccountRepository,
                customerRepository,
                transactionRepository,
                ledgerEntryRepository,
                auditService,
                accountingEngineService,
                depositProductConfigRepository
        );

        testBranch = Branch.builder()
                .id(1L)
                .branchCode("BLR001")
                .name("Koramangala Branch")
                .build();

        testUser = User.builder()
                .id(100L)
                .username("officer.rahul")
                .build();

        testCustomer = Customer.builder()
                .id(10L)
                .customerNumber("CIF-100234")
                .fullName("Vikramaditya Roy")
                .build();

        testAccount = BankAccount.builder()
                .id(50L)
                .accountNumber("1001000000000001")
                .customer(testCustomer)
                .branch(testBranch)
                .balance(new BigDecimal("500000.00"))
                .availableBalance(new BigDecimal("500000.00"))
                .accountType(AccountType.SAVINGS)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("1. Verify pure BigDecimal quarterly compounding against Indian Banking benchmark")
    void testQuarterlyCompoundingPrecision() {
        // ₹1,00,000 at 7.10% for 12 months (4 quarters)
        // Quarterly factor = 1 + (7.10 / 400) = 1.01775
        // (1.01775)^4 = 1.0729238... => ₹107,292.38
        DepositCalculationRequest request = DepositCalculationRequest.builder()
                .depositAmount(new BigDecimal("100000.00"))
                .tenureMonths(12)
                .interestRate(new BigDecimal("7.10"))
                .depositType("FIXED_DEPOSIT")
                .isSeniorCitizen(false)
                .tdsExemptionForm15G(false)
                .build();

        DepositCalculationResponse response = fixedDepositService.calculateDeposit(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("100000.00"), response.getPrincipalAmount());
        assertEquals(new BigDecimal("7.10"), response.getEffectiveInterestRate());
        assertEquals(new BigDecimal("107291.28"), response.getMaturityAmount());
        assertEquals(new BigDecimal("7291.28"), response.getTotalInterestEarned());
        // Since ₹7,291.28 < ₹40,000 threshold, TDS is 0.00
        assertEquals(BigDecimal.ZERO, response.getProjectedTdsAmount());
        assertEquals(new BigDecimal("107291.28"), response.getNetMaturityAmount());
    }

    @Test
    @DisplayName("2. Verify senior citizen interest bonus and Section 194A TDS threshold logic")
    void testSeniorCitizenBonusAndTdsCalculation() {
        // High Value Deposit: ₹10,00,000 at 7.50% for 36 months
        // Normal citizen interest exceeds ₹40,000 threshold => TDS @ 10%
        DepositCalculationRequest normalReq = DepositCalculationRequest.builder()
                .depositAmount(new BigDecimal("1000000.00"))
                .tenureMonths(36)
                .interestRate(new BigDecimal("7.50"))
                .depositType("FIXED_DEPOSIT")
                .isSeniorCitizen(false)
                .tdsExemptionForm15G(false)
                .build();

        DepositCalculationResponse normalRes = fixedDepositService.calculateDeposit(normalReq);
        assertTrue(normalRes.getIsTdsApplicable());
        assertTrue(normalRes.getProjectedTdsAmount().compareTo(BigDecimal.ZERO) > 0);

        // Senior citizen gets +0.50% bonus rate (8.00% total)
        DepositCalculationRequest seniorReq = DepositCalculationRequest.builder()
                .depositAmount(new BigDecimal("1000000.00"))
                .tenureMonths(36)
                .interestRate(new BigDecimal("7.50"))
                .depositType("FIXED_DEPOSIT")
                .isSeniorCitizen(true)
                .tdsExemptionForm15G(false)
                .build();

        DepositCalculationResponse seniorRes = fixedDepositService.calculateDeposit(seniorReq);
        assertEquals(new BigDecimal("8.00"), seniorRes.getEffectiveInterestRate());
        assertEquals(new BigDecimal("0.50"), seniorRes.getSeniorCitizenBonusRate());

        // When Form 15G/15H exemption is claimed => Zero TDS withheld
        DepositCalculationRequest form15gReq = DepositCalculationRequest.builder()
                .depositAmount(new BigDecimal("1000000.00"))
                .tenureMonths(36)
                .interestRate(new BigDecimal("7.50"))
                .depositType("FIXED_DEPOSIT")
                .isSeniorCitizen(true)
                .tdsExemptionForm15G(true)
                .build();

        DepositCalculationResponse form15gRes = fixedDepositService.calculateDeposit(form15gReq);
        assertEquals(BigDecimal.ZERO, form15gRes.getProjectedTdsAmount());
        assertFalse(form15gRes.getIsTdsApplicable());
    }

    @Test
    @DisplayName("3. Verify Recurring Deposit (RD) monthly installment compounding")
    void testRecurringDepositInstallmentCompounding() {
        // Monthly RD of ₹5,000 for 12 months at 6.85%
        DepositCalculationRequest rdReq = DepositCalculationRequest.builder()
                .depositAmount(new BigDecimal("5000.00"))
                .tenureMonths(12)
                .interestRate(new BigDecimal("6.85"))
                .depositType("RECURRING_DEPOSIT")
                .isSeniorCitizen(false)
                .tdsExemptionForm15G(false)
                .build();

        DepositCalculationResponse rdRes = fixedDepositService.calculateDeposit(rdReq);

        assertNotNull(rdRes);
        assertEquals("RECURRING_DEPOSIT", rdRes.getDepositType());
        // Total principal deposited across 12 months = ₹60,000.00
        // Maturity amount must be > ₹60,000.00
        assertTrue(rdRes.getMaturityAmount().compareTo(new BigDecimal("60000.00")) > 0);
        assertTrue(rdRes.getTotalInterestEarned().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("4. Verify Term Deposit creation, account balance debit, and double-entry GL posting")
    void testDepositCreationWithDoubleEntryLedger() {
        when(customerRepository.findById(10L)).thenReturn(Optional.of(testCustomer));
        when(bankAccountRepository.findByAccountNumberForUpdate("1001000000000001")).thenReturn(Optional.of(testAccount));
        when(fixedDepositRepository.save(any(FixedDeposit.class))).thenAnswer(inv -> {
            FixedDeposit fd = inv.getArgument(0);
            fd.setId(101L);
            return fd;
        });
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        FixedDepositCreateRequest request = FixedDepositCreateRequest.builder()
                .customerId(10L)
                .sourceAccountNumber("1001000000000001")
                .depositAmount(new BigDecimal("100000.00"))
                .tenureMonths(12)
                .depositType("FIXED_DEPOSIT")
                .autoRenew(true)
                .nomineeName("Anita Roy")
                .nomineeRelation("SPOUSE")
                .build();

        FixedDepositDto created = fixedDepositService.createFixedDeposit(request, testUser);

        assertNotNull(created);
        assertEquals("ACTIVE", created.getStatus());
        assertTrue(created.getCertificateNumber().startsWith("FD-BLR001-"));
        assertEquals(new BigDecimal("100000.00"), created.getDepositAmount());

        // Account balance must be debited by ₹100,000 (from 500k to 400k)
        assertEquals(new BigDecimal("400000.00"), testAccount.getBalance());
        assertEquals(new BigDecimal("400000.00"), testAccount.getAvailableBalance());

        // Verify Double-Entry GL accounting posting (DR 2010 / CR 2030)
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                anyString(), eq("FD_CREATION"), eq(new BigDecimal("100000.00")), eq(testBranch), eq(testUser), anyString()
        );
    }

    @Test
    @DisplayName("5. Verify premature closure quote with 1.00% penalty and GL liquidation settlement")
    void testPrematureClosureWithPenaltyCalculation() {
        FixedDeposit activeFd = FixedDeposit.builder()
                .id(205L)
                .certificateNumber("FD-BLR001-889922")
                .customer(testCustomer)
                .sourceAccount(testAccount)
                .branch(testBranch)
                .depositAmount(new BigDecimal("200000.00"))
                .interestRate(new BigDecimal("7.50"))
                .tenureMonths(36)
                .maturityAmount(new BigDecimal("249721.00"))
                .depositDate(LocalDateTime.now().minusMonths(6))
                .maturityDate(LocalDateTime.now().plusMonths(30))
                .status("ACTIVE")
                .payoutAccountNumber("1001000000000001")
                .build();

        when(fixedDepositRepository.findById(205L)).thenReturn(Optional.of(activeFd));

        PrematureClosureQuoteDto quote = fixedDepositService.getPrematureClosureQuote(205L);
        assertNotNull(quote);
        assertEquals(new BigDecimal("200000.00"), quote.getOriginalPrincipal());
        assertEquals(new BigDecimal("1.00"), quote.getPrematurePenaltyPercentage());
        // Revised penalized rate = 7.50% - 1.00% = 6.50%
        assertEquals(new BigDecimal("6.50"), quote.getRevisedPenalizedInterestRate());
        assertTrue(quote.getNetPayoutAmount().compareTo(new BigDecimal("200000.00")) > 0);

        // Execute premature closure
        when(bankAccountRepository.findByAccountNumberForUpdate("1001000000000001")).thenReturn(Optional.of(testAccount));
        when(fixedDepositRepository.save(any(FixedDeposit.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        PrematureClosureRequest execReq = PrematureClosureRequest.builder()
                .depositId(205L)
                .payoutAccountNumber("1001000000000001")
                .acknowledgePenalty(true)
                .reason("Medical emergency")
                .build();

        FixedDepositDto closed = fixedDepositService.executePrematureClosure(execReq, testUser);
        assertNotNull(closed);
        assertEquals("PREMATURELY_CLOSED", closed.getStatus());

        // Verify General Ledger liquidation posting
        verify(accountingEngineService, times(1)).postTransactionAccountingEntry(
                anyString(), eq("FD_PREMATURE_WITHDRAWAL"), any(BigDecimal.class), eq(testBranch), eq(testUser), anyString()
        );
    }

    @Test
    @DisplayName("6. Verify Deposit Certificate generation and Auto-Renewal rollover")
    void testCertificateAndAutoRenewal() {
        FixedDeposit activeFd = FixedDeposit.builder()
                .id(301L)
                .certificateNumber("FD-BLR001-554433")
                .customer(testCustomer)
                .sourceAccount(testAccount)
                .branch(testBranch)
                .productCode("FD_STANDARD_PRIME")
                .depositAmount(new BigDecimal("150000.00"))
                .interestRate(new BigDecimal("7.10"))
                .tenureMonths(12)
                .maturityAmount(new BigDecimal("160938.57"))
                .depositDate(LocalDateTime.now().minusMonths(12))
                .maturityDate(LocalDateTime.now())
                .status("MATURED")
                .nomineeName("Anita Roy")
                .nomineeRelation("SPOUSE")
                .build();

        when(fixedDepositRepository.findById(301L)).thenReturn(Optional.of(activeFd));

        // Test Certificate Retrieval
        DepositCertificateDto cert = fixedDepositService.getDepositCertificate(301L);
        assertNotNull(cert);
        assertEquals("FD-BLR001-554433", cert.getCertificateNumber());
        assertEquals("Vikramaditya Roy", cert.getCustomerName());
        assertEquals("Anita Roy", cert.getNomineeName());

        // Test Auto-Renewal Rollover
        when(fixedDepositRepository.save(any(FixedDeposit.class))).thenAnswer(inv -> inv.getArgument(0));

        FixedDepositDto renewed = fixedDepositService.executeAutoRenewal(301L, testUser);
        assertNotNull(renewed);
        assertEquals("ACTIVE", renewed.getStatus());
        // New principal must equal old maturity amount (₹160,938.57)
        assertEquals(new BigDecimal("160938.57"), renewed.getDepositAmount());
        assertEquals(12, renewed.getTenureMonths());
    }
}
