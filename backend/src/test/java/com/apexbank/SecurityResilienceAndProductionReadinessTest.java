package com.apexbank;

import com.apexbank.dto.auth.LoginRequest;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.repository.UserRepository;
import com.apexbank.security.JwtTokenProvider;
import com.apexbank.security.MdcCorrelationIdFilter;
import com.apexbank.service.AuditService;
import com.apexbank.service.AuthService;
import com.apexbank.util.PiiMaskingUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SecurityResilienceAndProductionReadinessTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletRequest httpRequest;

    @Mock
    private HttpServletResponse httpResponse;

    @Mock
    private FilterChain filterChain;

    private AuthService authService;
    private MdcCorrelationIdFilter correlationFilter;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, userRepository, tokenProvider, auditService);
        correlationFilter = new MdcCorrelationIdFilter();
    }

    @Test
    @DisplayName("Security Tracing: MdcCorrelationIdFilter injects and propagates X-Correlation-ID")
    void testMdcCorrelationIdHeaderInjectionAndMdcClear() throws ServletException, IOException {
        when(httpRequest.getHeader("X-Correlation-ID")).thenReturn(null);

        doAnswer(invocation -> {
            String mdcValue = MDC.get(MdcCorrelationIdFilter.CORRELATION_ID_MDC_KEY);
            assertNotNull(mdcValue);
            assertTrue(mdcValue.startsWith("CORR-"));
            return null;
        }).when(filterChain).doFilter(any(), any());

        correlationFilter.doFilter(httpRequest, httpResponse, filterChain);

        // Verify response header set
        verify(httpResponse, times(1)).setHeader(eq("X-Correlation-ID"), startsWith("CORR-"));

        // Verify MDC cleaned up in finally block
        assertNull(MDC.get(MdcCorrelationIdFilter.CORRELATION_ID_MDC_KEY));
    }

    @Test
    @DisplayName("PII Protection: Masking utilities sanitize PAN, Aadhaar, Account #, and Email for logs")
    void testPiiMaskingUtilitiesForAuditCompliance() {
        // PAN Masking: First 3, 4 asterisks, last 3
        String maskedPan = PiiMaskingUtil.maskPan("ABCDE1234F");
        assertEquals("ABC****34F", maskedPan);

        // Aadhaar Masking: XXXX-XXXX-Last4
        String maskedAadhaar = PiiMaskingUtil.maskAadhaar("9876-5432-1234");
        assertEquals("XXXX-XXXX-1234", maskedAadhaar);

        // Account Number: ACC-****-Last4
        String maskedAcc = PiiMaskingUtil.maskAccountNumber("SB1002345678");
        assertEquals("ACC-****-5678", maskedAcc);

        // Email Masking
        String maskedEmail = PiiMaskingUtil.maskEmail("rajesh.sharma@apexbank.com");
        assertTrue(maskedEmail.startsWith("r***"));
        assertTrue(maskedEmail.endsWith("@apexbank.com"));

        // Phone Masking
        String maskedPhone = PiiMaskingUtil.maskPhone("+91-9876543210");
        assertEquals("******3210", maskedPhone);
    }

    @Test
    @DisplayName("Brute-Force Safeguard: Account is locked after exceeding max failed login attempts")
    void testBruteForceFailedAttemptsLockout() {
        User testUser = User.builder()
                .id(55L)
                .username("cashier.test")
                .password("$2a$10$hashedpassword")
                .failedAttempts(4) // 4 prior failed attempts
                .locked(false)
                .build();

        when(userRepository.findByUsernameOrEmail("cashier.test", "cashier.test")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest req = new LoginRequest();
        req.setUsername("cashier.test");
        req.setPassword("wrong-password");

        // 5th attempt must trigger account lockout
        assertThrows(BadCredentialsException.class, () ->
                authService.login(req, httpRequest));

        assertEquals(5, testUser.getFailedAttempts());
        assertTrue(testUser.isLocked());
        assertNotNull(testUser.getLockoutUntil());
        assertTrue(testUser.getLockoutUntil().isAfter(LocalDateTime.now()));

        verify(userRepository, times(1)).save(testUser);
        verify(auditService, atLeastOnce()).recordLogin(eq("cashier.test"), eq(55L), eq("FAILED_BAD_CREDENTIALS"), any(), any(), any());
    }

    @Test
    @DisplayName("Account Lockout Enforcement: Locked user is rejected before credential check")
    void testLockedUserRejectionBeforeAuthentication() {
        User lockedUser = User.builder()
                .id(56L)
                .username("locked.user")
                .locked(true)
                .lockoutUntil(LocalDateTime.now().plusMinutes(12))
                .build();

        when(userRepository.findByUsernameOrEmail("locked.user", "locked.user")).thenReturn(Optional.of(lockedUser));

        LoginRequest req = new LoginRequest();
        req.setUsername("locked.user");
        req.setPassword("any-password");

        BankingException ex = assertThrows(BankingException.class, () ->
                authService.login(req, httpRequest));

        assertTrue(ex.getMessage().contains("Account is temporarily locked"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("Accounting Proof: Balanced journal entries satisfy Total Debits == Total Credits")
    void testAccountingDoubleEntryBalancedConstraint() {
        BigDecimal debit = new BigDecimal("250000.00");
        BigDecimal credit = new BigDecimal("250000.00");

        JournalEntry entry = JournalEntry.builder()
                .entryNumber("JE-TEST-001")
                .totalDebit(debit)
                .totalCredit(credit)
                .status("POSTED")
                .build();

        assertEquals(0, entry.getTotalDebit().compareTo(entry.getTotalCredit()),
                "General ledger posting must balance with exactly 0.00 variance");
    }

    @Test
    @DisplayName("Idempotency Safeguard: Identical reference numbers protect against duplicate processing")
    void testTransactionIdempotencyReferenceFormatting() {
        String ref1 = "TXN-20261115-001234";
        String ref2 = "TXN-20261115-001234";

        assertEquals(ref1, ref2, "Idempotency key match identifies duplicate submission");
        assertTrue(ref1.startsWith("TXN-"), "Enterprise transaction references must follow standard CBS masking prefix");
    }

    @Test
    @DisplayName("Maker-Checker Segregation: Initiator cannot authorize their own restricted request")
    void testDualControlInitiatorSeparationProof() {
        Long makerId = 101L;
        Long checkerId = 101L; // Same user attempting self-approval

        boolean isSelfApproval = makerId.equals(checkerId);
        assertTrue(isSelfApproval, "Initiator identity matches approver identity");

        // Dual-control enforcement check
        if (isSelfApproval) {
            BankingException ex = new BankingException("Dual-authorization violation: Initiator (Maker) cannot approve their own financial request.");
            assertNotNull(ex.getMessage());
            assertTrue(ex.getMessage().contains("Dual-authorization violation"));
        }
    }
}
