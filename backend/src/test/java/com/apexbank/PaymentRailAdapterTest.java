package com.apexbank;

import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.entity.BankAccount;
import com.apexbank.entity.Branch;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.*;
import com.apexbank.exception.BankingException;
import com.apexbank.repository.BankAccountRepository;
import com.apexbank.repository.paymentrail.PaymentStatusHistoryRepository;
import com.apexbank.repository.paymentrail.PaymentTransactionRecordRepository;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuditService;
import com.apexbank.service.paymentrail.IMPSPaymentAdapter;
import com.apexbank.service.paymentrail.InternalBankTransferAdapter;
import com.apexbank.service.paymentrail.NEFTPaymentAdapter;
import com.apexbank.service.paymentrail.RTGSPaymentAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class PaymentRailAdapterTest {

    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private PaymentTransactionRecordRepository paymentRecordRepository;
    @Mock private PaymentStatusHistoryRepository statusHistoryRepository;
    @Mock private AccountingEngineService accountingEngineService;
    @Mock private AuditService auditService;

    private InternalBankTransferAdapter internalAdapter;
    private NEFTPaymentAdapter neftAdapter;
    private RTGSPaymentAdapter rtgsAdapter;
    private IMPSPaymentAdapter impsAdapter;

    private BankAccount sourceAccount;
    private BankAccount destAccount;
    private User testUser;
    private Branch testBranch;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        internalAdapter = new InternalBankTransferAdapter(
                bankAccountRepository, paymentRecordRepository, statusHistoryRepository, accountingEngineService, auditService
        );
        neftAdapter = new NEFTPaymentAdapter(
                bankAccountRepository, paymentRecordRepository, statusHistoryRepository, accountingEngineService, auditService
        );
        rtgsAdapter = new RTGSPaymentAdapter(
                bankAccountRepository, paymentRecordRepository, statusHistoryRepository, accountingEngineService, auditService
        );
        impsAdapter = new IMPSPaymentAdapter(
                bankAccountRepository, paymentRecordRepository, statusHistoryRepository, accountingEngineService, auditService
        );

        testBranch = Branch.builder().id(1L).name("Apex Main Branch").build();
        testUser = User.builder().id(1L).username("test_officer").branch(testBranch).build();

        sourceAccount = BankAccount.builder()
                .id(101L)
                .accountNumber("1001000000000001")
                .balance(new BigDecimal("1000000.00"))
                .availableBalance(new BigDecimal("1000000.00"))
                .status("ACTIVE")
                .branch(testBranch)
                .build();

        destAccount = BankAccount.builder()
                .id(102L)
                .accountNumber("1001000000000002")
                .balance(new BigDecimal("50000.00"))
                .availableBalance(new BigDecimal("50000.00"))
                .status("ACTIVE")
                .branch(testBranch)
                .build();

        when(bankAccountRepository.findByAccountNumberForUpdate("1001000000000001")).thenReturn(Optional.of(sourceAccount));
        when(bankAccountRepository.findByAccountNumberForUpdate("1001000000000002")).thenReturn(Optional.of(destAccount));

        when(paymentRecordRepository.save(any(PaymentTransactionRecord.class))).thenAnswer(inv -> {
            PaymentTransactionRecord r = inv.getArgument(0);
            r.setId(999L);
            return r;
        });
    }

    @Test
    @DisplayName("Internal Transfer Adapter executes book settlement and updates both accounts")
    void testInternalTransferSuccess() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("1001000000000002")
                .beneficiaryName("Priya Patel")
                .amount(new BigDecimal("25000.00"))
                .railType(PaymentRailType.INTERNAL)
                .build();

        PaymentRailResponseDto response = internalAdapter.processPayment(request, sourceAccount, testUser);

        assertNotNull(response);
        assertEquals(PaymentRailStatus.SETTLED, response.getStatus());
        assertEquals(new BigDecimal("25000.00"), response.getAmount());
        assertEquals(BigDecimal.ZERO, response.getFee());
        assertEquals(new BigDecimal("975000.00"), sourceAccount.getBalance());
        assertEquals(new BigDecimal("75000.00"), destAccount.getBalance());
        assertTrue(response.getPaymentReference().startsWith("INT-"));
        assertTrue(response.getIsDemoSimulated());
    }

    @Test
    @DisplayName("Internal Transfer rejects transfer between identical accounts")
    void testInternalTransferFailsForSameAccount() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("1001000000000001")
                .beneficiaryName("Self")
                .amount(new BigDecimal("5000.00"))
                .railType(PaymentRailType.INTERNAL)
                .build();

        BankingException ex = assertThrows(BankingException.class, () ->
                internalAdapter.processPayment(request, sourceAccount, testUser));
        assertTrue(ex.getMessage().contains("Source and destination accounts must be distinct"));
    }

    @Test
    @DisplayName("NEFT Adapter generates 16-character UTR, calculates tiered fee, and simulates batch window")
    void testNeftBatchSimulationAndUtrFormat() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Sunil Verma")
                .beneficiaryIfsc("HDFC0001234")
                .amount(new BigDecimal("50000.00"))
                .railType(PaymentRailType.NEFT)
                .simulatedOutcome(SimulationOutcome.SUCCESS)
                .build();

        PaymentRailResponseDto response = neftAdapter.processPayment(request, sourceAccount, testUser);

        assertNotNull(response);
        assertEquals(PaymentRailStatus.SIMULATED_ACCEPTED, response.getStatus());
        assertEquals(new BigDecimal("5.00"), response.getFee()); // 50k falls in 10k-100k slab (Rs 5 fee)
        assertEquals(new BigDecimal("50005.00"), response.getTotalDebited());
        assertNotNull(response.getUtrNumber());
        assertTrue(response.getUtrNumber().startsWith("APEXN"));
        assertEquals(16, response.getUtrNumber().length());
        assertTrue(response.getSettlementBatchId().startsWith("NEFT-"));
        assertTrue(response.getIsDemoSimulated());
    }

    @Test
    @DisplayName("RTGS Adapter strictly enforces RBI minimum threshold of INR 2,00,000")
    void testRtgsEnforcesMinimumTwoLakhs() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Reliance Ltd")
                .beneficiaryIfsc("SBIN0000123")
                .amount(new BigDecimal("199999.00")) // Below 2 Lakhs threshold
                .railType(PaymentRailType.RTGS)
                .build();

        BankingException ex = assertThrows(BankingException.class, () ->
                rtgsAdapter.processPayment(request, sourceAccount, testUser));
        assertTrue(ex.getMessage().contains("RTGS minimum transaction threshold is INR 2,00,000.00"));
    }

    @Test
    @DisplayName("RTGS Adapter successfully processes high-value gross transaction above ₹2,00,000")
    void testRtgsSuccessForHighValue() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Reliance Ltd")
                .beneficiaryIfsc("SBIN0000123")
                .amount(new BigDecimal("350000.00"))
                .railType(PaymentRailType.RTGS)
                .simulatedOutcome(SimulationOutcome.SUCCESS)
                .build();

        PaymentRailResponseDto response = rtgsAdapter.processPayment(request, sourceAccount, testUser);

        assertNotNull(response);
        assertEquals(PaymentRailStatus.SETTLED, response.getStatus());
        assertEquals(new BigDecimal("25.00"), response.getFee()); // 3.5L falls in 2L-5L slab (Rs 25 fee)
        assertNotNull(response.getUtrNumber());
        assertTrue(response.getUtrNumber().startsWith("APEXR"));
        assertEquals(16, response.getUtrNumber().length());
        assertTrue(response.getIsDemoSimulated());
    }

    @Test
    @DisplayName("IMPS Adapter strictly enforces NPCI maximum cap of INR 5,00,000")
    void testImpsEnforcesMaximumFiveLakhs() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Vijay Kumar")
                .beneficiaryIfsc("ICIC0000999")
                .amount(new BigDecimal("500001.00")) // Above 5 Lakhs ceiling
                .railType(PaymentRailType.IMPS)
                .build();

        BankingException ex = assertThrows(BankingException.class, () ->
                impsAdapter.processPayment(request, sourceAccount, testUser));
        assertTrue(ex.getMessage().contains("IMPS per-transaction ceiling is INR 5,00,000.00"));
    }

    @Test
    @DisplayName("IMPS Adapter processes instant payment and generates 12-digit RRN")
    void testImpsInstantSettlementAndRrnFormat() {
        PaymentRailRequestDto request = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Vijay Kumar")
                .beneficiaryIfsc("ICIC0000999")
                .amount(new BigDecimal("15000.00"))
                .railType(PaymentRailType.IMPS)
                .simulatedOutcome(SimulationOutcome.SUCCESS)
                .build();

        PaymentRailResponseDto response = impsAdapter.processPayment(request, sourceAccount, testUser);

        assertNotNull(response);
        assertEquals(PaymentRailStatus.SETTLED, response.getStatus());
        assertEquals(new BigDecimal("5.00"), response.getFee());
        assertNotNull(response.getRrnNumber());
        assertEquals(12, response.getRrnNumber().length()); // Day (3) + Hour (2) + 7 digits = 12 digits
        assertTrue(response.getRrnNumber().matches("\\d+"));
        assertTrue(response.getIsDemoSimulated());
    }

    @Test
    @DisplayName("Simulation Mode handles negative clearance without deducting funds, and simulates gateway timeout")
    void testSimulationNegativeClearanceAndTimeout() {
        BigDecimal initialBal = sourceAccount.getBalance();

        // 1. Beneficiary Rejected outcome
        PaymentRailRequestDto rejectedReq = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Invalid Account")
                .beneficiaryIfsc("HDFC0001234")
                .amount(new BigDecimal("10000.00"))
                .railType(PaymentRailType.NEFT)
                .simulatedOutcome(SimulationOutcome.BENEFICIARY_REJECTED)
                .build();

        PaymentRailResponseDto rejectedResp = neftAdapter.processPayment(rejectedReq, sourceAccount, testUser);
        assertEquals(PaymentRailStatus.SIMULATED_REJECTED, rejectedResp.getStatus());
        assertEquals(initialBal, sourceAccount.getBalance(), "Funds must NOT be deducted when transaction is rejected");

        // 2. Gateway Timeout outcome
        PaymentRailRequestDto timeoutReq = PaymentRailRequestDto.builder()
                .sourceAccountNumber("1001000000000001")
                .destinationAccountNumber("9876543210123")
                .beneficiaryName("Lagging Gateway")
                .beneficiaryIfsc("HDFC0001234")
                .amount(new BigDecimal("10000.00"))
                .railType(PaymentRailType.NEFT)
                .simulatedOutcome(SimulationOutcome.NETWORK_TIMEOUT)
                .build();

        PaymentRailResponseDto timeoutResp = neftAdapter.processPayment(timeoutReq, sourceAccount, testUser);
        assertEquals(PaymentRailStatus.SIMULATED_TIMEOUT, timeoutResp.getStatus());
        assertTrue(timeoutResp.getResponseCode().contains("TIMEOUT"));
    }
}
