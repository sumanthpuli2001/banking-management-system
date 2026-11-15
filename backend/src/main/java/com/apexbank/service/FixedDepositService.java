package com.apexbank.service;

import com.apexbank.dto.deposit.*;
import com.apexbank.entity.*;
import com.apexbank.entity.deposit.DepositProductConfig;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import com.apexbank.repository.deposit.DepositProductConfigRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FixedDepositService {

    private static final MathContext MC = MathContext.DECIMAL128;
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal FOUR_HUNDRED = new BigDecimal("400");
    private static final BigDecimal TWELVE_HUNDRED = new BigDecimal("1200");
    private static final BigDecimal TDS_RATE = new BigDecimal("0.10"); // 10% TDS
    private static final BigDecimal STANDARD_TDS_THRESHOLD = new BigDecimal("40000.00");
    private static final BigDecimal SENIOR_TDS_THRESHOLD = new BigDecimal("50000.00");

    private final FixedDepositRepository fixedDepositRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;
    private final DepositProductConfigRepository depositProductConfigRepository;

    public FixedDepositService(FixedDepositRepository fixedDepositRepository,
                               BankAccountRepository bankAccountRepository,
                               CustomerRepository customerRepository,
                               TransactionRepository transactionRepository,
                               TransactionLedgerEntryRepository ledgerEntryRepository,
                               AuditService auditService,
                               AccountingEngineService accountingEngineService,
                               DepositProductConfigRepository depositProductConfigRepository) {
        this.fixedDepositRepository = fixedDepositRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
        this.depositProductConfigRepository = depositProductConfigRepository;
    }

    @PostConstruct
    public void initDefaultDepositProducts() {
        if (depositProductConfigRepository.count() == 0) {
            depositProductConfigRepository.save(DepositProductConfig.builder()
                    .productCode("FD_STANDARD_PRIME")
                    .productName("Apex Standard Cumulative Fixed Deposit")
                    .depositType("FIXED_DEPOSIT")
                    .minAmount(new BigDecimal("5000.00"))
                    .maxAmount(new BigDecimal("100000000.00"))
                    .minTenureMonths(6)
                    .maxTenureMonths(120)
                    .baseInterestRate(new BigDecimal("7.10"))
                    .seniorCitizenBonusRate(new BigDecimal("0.50"))
                    .compoundingFrequency("QUARTERLY")
                    .prematurePenaltyRate(new BigDecimal("1.00"))
                    .lockInMonths(0)
                    .isTaxSaver(false)
                    .description("Quarterly compounded institutional term deposit with high liquidity and auto-renewal facility.")
                    .isActive(true)
                    .build());

            depositProductConfigRepository.save(DepositProductConfig.builder()
                    .productCode("FD_SENIOR_SECURE")
                    .productName("Apex Golden Years Senior Citizen Deposit")
                    .depositType("FIXED_DEPOSIT")
                    .minAmount(new BigDecimal("10000.00"))
                    .maxAmount(new BigDecimal("50000000.00"))
                    .minTenureMonths(12)
                    .maxTenureMonths(120)
                    .baseInterestRate(new BigDecimal("7.60")) // 7.10 + 0.50
                    .seniorCitizenBonusRate(new BigDecimal("0.50"))
                    .compoundingFrequency("QUARTERLY")
                    .prematurePenaltyRate(new BigDecimal("0.50"))
                    .lockInMonths(0)
                    .isTaxSaver(false)
                    .description("Special interest premium for senior citizens with higher TDS exemption limits.")
                    .isActive(true)
                    .build());

            depositProductConfigRepository.save(DepositProductConfig.builder()
                    .productCode("FD_TAX_SAVER_5YR")
                    .productName("Apex Section 80C Tax Shield Deposit")
                    .depositType("FIXED_DEPOSIT")
                    .minAmount(new BigDecimal("10000.00"))
                    .maxAmount(new BigDecimal("150000.00"))
                    .minTenureMonths(60)
                    .maxTenureMonths(60)
                    .baseInterestRate(new BigDecimal("7.25"))
                    .seniorCitizenBonusRate(new BigDecimal("0.50"))
                    .compoundingFrequency("QUARTERLY")
                    .prematurePenaltyRate(new BigDecimal("2.50"))
                    .lockInMonths(60)
                    .isTaxSaver(true)
                    .description("Tax-saving fixed deposit under Section 80C with statutory 5-year lock-in period.")
                    .isActive(true)
                    .build());

            depositProductConfigRepository.save(DepositProductConfig.builder()
                    .productCode("RD_WEALTH_BUILDER")
                    .productName("Apex Recurring Wealth Builder")
                    .depositType("RECURRING_DEPOSIT")
                    .minAmount(new BigDecimal("1000.00"))
                    .maxAmount(new BigDecimal("1000000.00"))
                    .minTenureMonths(6)
                    .maxTenureMonths(60)
                    .baseInterestRate(new BigDecimal("6.85"))
                    .seniorCitizenBonusRate(new BigDecimal("0.50"))
                    .compoundingFrequency("QUARTERLY")
                    .prematurePenaltyRate(new BigDecimal("1.00"))
                    .lockInMonths(0)
                    .isTaxSaver(false)
                    .description("Disciplined monthly savings plan compounding quarterly into a substantial maturity corpus.")
                    .isActive(true)
                    .build());
        }
    }

    public List<DepositProductDto> getActiveDepositProducts() {
        return depositProductConfigRepository.findByIsActiveTrue().stream()
                .map(this::mapProductToDto)
                .collect(Collectors.toList());
    }

    /**
     * Pure BigDecimal compound interest calculation engine
     * Implements RBI Quarterly compounding formula:
     * A = P * (1 + r/400)^q * (1 + r*m_rem/1200)
     */
    public DepositCalculationResponse calculateDeposit(DepositCalculationRequest request) {
        BigDecimal principal = request.getDepositAmount();
        int months = request.getTenureMonths();
        String type = request.getDepositType() != null ? request.getDepositType() : "FIXED_DEPOSIT";
        boolean isSenior = Boolean.TRUE.equals(request.getIsSeniorCitizen());
        boolean form15G = Boolean.TRUE.equals(request.getTdsExemptionForm15G());

        // Resolve base rate
        BigDecimal baseRate = request.getInterestRate();
        BigDecimal seniorBonus = isSenior ? new BigDecimal("0.50") : BigDecimal.ZERO;

        if (baseRate == null || baseRate.compareTo(BigDecimal.ZERO) <= 0) {
            if (months >= 36) {
                baseRate = new BigDecimal("7.50");
            } else if (months >= 12) {
                baseRate = new BigDecimal("7.10");
            } else {
                baseRate = new BigDecimal("6.50");
            }
        }

        BigDecimal effectiveRate = baseRate.add(seniorBonus);
        BigDecimal maturityAmount;
        BigDecimal totalInterest;

        if ("RECURRING_DEPOSIT".equalsIgnoreCase(type)) {
            // Installment-by-installment quarterly compounding
            BigDecimal accumulated = BigDecimal.ZERO;
            for (int i = 1; i <= months; i++) {
                int remMonths = months - i + 1;
                BigDecimal installmentMaturity = compoundQuarterly(principal, effectiveRate, remMonths);
                accumulated = accumulated.add(installmentMaturity);
            }
            maturityAmount = accumulated.setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalDeposited = principal.multiply(BigDecimal.valueOf(months));
            totalInterest = maturityAmount.subtract(totalDeposited).setScale(2, RoundingMode.HALF_UP);
        } else {
            // Standard Lump-Sum Fixed Deposit
            maturityAmount = compoundQuarterly(principal, effectiveRate, months).setScale(2, RoundingMode.HALF_UP);
            totalInterest = maturityAmount.subtract(principal).setScale(2, RoundingMode.HALF_UP);
        }

        // Section 194A TDS calculation
        BigDecimal tdsThreshold = isSenior ? SENIOR_TDS_THRESHOLD : STANDARD_TDS_THRESHOLD;
        BigDecimal projectedTds = BigDecimal.ZERO;
        boolean isTdsApplicable = false;

        if (!form15G && totalInterest.compareTo(tdsThreshold) > 0) {
            projectedTds = totalInterest.multiply(TDS_RATE).setScale(2, RoundingMode.HALF_UP);
            isTdsApplicable = true;
        }

        BigDecimal netMaturity = maturityAmount.subtract(projectedTds);

        return DepositCalculationResponse.builder()
                .depositType(type)
                .principalAmount(principal)
                .tenureMonths(months)
                .contractedInterestRate(baseRate)
                .seniorCitizenBonusRate(seniorBonus)
                .effectiveInterestRate(effectiveRate)
                .compoundingFrequency("QUARTERLY")
                .totalInterestEarned(totalInterest)
                .maturityAmount(maturityAmount)
                .projectedTdsAmount(projectedTds)
                .netMaturityAmount(netMaturity)
                .isSeniorCitizen(isSenior)
                .isTdsApplicable(isTdsApplicable)
                .build();
    }

    private BigDecimal compoundQuarterly(BigDecimal p, BigDecimal annualRate, int months) {
        int quarters = months / 3;
        int remMonths = months % 3;

        // quarterlyFactor = 1 + (annualRate / 400)
        BigDecimal quarterlyFactor = BigDecimal.ONE.add(annualRate.divide(FOUR_HUNDRED, MC));
        BigDecimal compoundedFactor = quarterlyFactor.pow(quarters, MC);
        BigDecimal amountAfterQuarters = p.multiply(compoundedFactor, MC);

        if (remMonths > 0) {
            // simple interest for residual fractional quarter months
            // remFactor = 1 + (annualRate * remMonths / 1200)
            BigDecimal remFactor = BigDecimal.ONE.add(
                    annualRate.multiply(BigDecimal.valueOf(remMonths)).divide(TWELVE_HUNDRED, MC)
            );
            return amountAfterQuarters.multiply(remFactor, MC);
        }
        return amountAfterQuarters;
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

        // Run calculation
        DepositCalculationRequest calcReq = DepositCalculationRequest.builder()
                .depositAmount(amount)
                .tenureMonths(request.getTenureMonths())
                .depositType(request.getDepositType())
                .productCode(request.getProductCode())
                .isSeniorCitizen(request.getIsSeniorCitizen())
                .tdsExemptionForm15G(request.getTdsExemptionForm15G())
                .build();

        DepositCalculationResponse calcRes = calculateDeposit(calcReq);

        // Deduct from source account
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(amount));
        sourceAccount.setAvailableBalance(sourceAccount.getAvailableBalance().subtract(amount));
        bankAccountRepository.save(sourceAccount);

        String prefix = "RECURRING_DEPOSIT".equalsIgnoreCase(request.getDepositType()) ? "RD" : "FD";
        String certNo = prefix + "-" + sourceAccount.getBranch().getBranchCode() + "-" + System.currentTimeMillis();

        String payoutAccount = request.getPayoutAccountNumber() != null && !request.getPayoutAccountNumber().isBlank()
                ? request.getPayoutAccountNumber()
                : sourceAccount.getAccountNumber();

        FixedDeposit fd = FixedDeposit.builder()
                .certificateNumber(certNo)
                .customer(customer)
                .sourceAccount(sourceAccount)
                .branch(sourceAccount.getBranch())
                .productCode(request.getProductCode() != null ? request.getProductCode() : "FD_STANDARD_PRIME")
                .depositType(request.getDepositType() != null ? request.getDepositType() : "FIXED_DEPOSIT")
                .depositAmount(amount)
                .monthlyInstallmentAmount("RECURRING_DEPOSIT".equalsIgnoreCase(request.getDepositType()) ? amount : null)
                .installmentsPaid(1)
                .totalInstallments(request.getTenureMonths())
                .interestRate(calcRes.getEffectiveInterestRate())
                .tenureMonths(request.getTenureMonths())
                .compoundingFrequency("QUARTERLY")
                .isSeniorCitizen(calcRes.getIsSeniorCitizen())
                .seniorCitizenBonusRate(calcRes.getSeniorCitizenBonusRate())
                .maturityAmount(calcRes.getMaturityAmount())
                .totalInterestPayable(calcRes.getTotalInterestEarned())
                .accruedInterest(BigDecimal.ZERO)
                .taxDeductedAtSource(calcRes.getProjectedTdsAmount())
                .tdsExemptionForm15G(Boolean.TRUE.equals(request.getTdsExemptionForm15G()))
                .depositDate(LocalDateTime.now())
                .maturityDate(LocalDateTime.now().plusMonths(request.getTenureMonths()))
                .autoRenew(request.isAutoRenew())
                .nomineeName(request.getNomineeName())
                .nomineeRelation(request.getNomineeRelation())
                .payoutAccountNumber(payoutAccount)
                .status("ACTIVE")
                .build();

        FixedDeposit savedFd = fixedDepositRepository.save(fd);

        // Record Transaction
        String txnRef = "TXN-" + prefix + "-" + System.currentTimeMillis();
        Transaction txn = Transaction.builder()
                .referenceNumber(txnRef)
                .sourceAccount(sourceAccount)
                .amount(amount)
                .transactionType("RECURRING_DEPOSIT".equalsIgnoreCase(request.getDepositType()) ? TransactionType.RD_CREATION : TransactionType.FD_CREATION)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("CUSTOMER_PORTAL")
                .narration(prefix + " Term Deposit booking: " + certNo)
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

        // Double-Entry General Ledger Posting:
        // Debit: 2010-DEMAND-DEPOSITS-SAVINGS
        // Credit: 2030-TERM-DEPOSITS-FD or 2040-RECURRING-DEPOSITS-RD
        String eventCode = "RECURRING_DEPOSIT".equalsIgnoreCase(request.getDepositType()) ? "RD_CREATION" : "FD_CREATION";
        accountingEngineService.postTransactionAccountingEntry(
                txnRef, eventCode, amount, sourceAccount.getBranch(), currentUser,
                prefix + " Deposit Creation: " + certNo
        );

        auditService.recordAudit(currentUser, prefix + "_CREATED", "TERM_DEPOSIT", certNo,
                prefix + " Deposit booked for INR " + amount + " at " + calcRes.getEffectiveInterestRate() + "% for " + request.getTenureMonths() + " months",
                "127.0.0.1", "SUCCESS");

        return mapToDto(savedFd);
    }

    @Transactional(readOnly = true)
    public PrematureClosureQuoteDto getPrematureClosureQuote(Long depositId) {
        FixedDeposit fd = fixedDepositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("FixedDeposit", "id", depositId));

        if (!"ACTIVE".equals(fd.getStatus())) {
            throw new BankingException("Deposit is not in ACTIVE state. Current status: " + fd.getStatus());
        }

        long completedDays = ChronoUnit.DAYS.between(fd.getDepositDate(), LocalDateTime.now());
        int completedMonths = (int) (completedDays / 30);
        if (completedMonths < 1) completedMonths = 1;

        // Premature penalty rate
        BigDecimal penaltyPercentage = new BigDecimal("1.00");
        BigDecimal contractedRate = fd.getInterestRate();
        BigDecimal penalizedRate = contractedRate.subtract(penaltyPercentage);
        if (penalizedRate.compareTo(new BigDecimal("0.50")) < 0) {
            penalizedRate = new BigDecimal("0.50");
        }

        // Recalculate earned interest at penalized rate
        BigDecimal penalizedMaturity = compoundQuarterly(fd.getDepositAmount(), penalizedRate, completedMonths);
        BigDecimal earnedInterest = penalizedMaturity.subtract(fd.getDepositAmount()).setScale(2, RoundingMode.HALF_UP);

        // Potential interest at contracted rate
        BigDecimal normalMaturity = compoundQuarterly(fd.getDepositAmount(), contractedRate, completedMonths);
        BigDecimal normalInterest = normalMaturity.subtract(fd.getDepositAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal penaltyDeducted = normalInterest.subtract(earnedInterest).setScale(2, RoundingMode.HALF_UP);
        if (penaltyDeducted.compareTo(BigDecimal.ZERO) < 0) penaltyDeducted = BigDecimal.ZERO;

        // TDS on earned interest
        BigDecimal tdsThreshold = Boolean.TRUE.equals(fd.getIsSeniorCitizen()) ? SENIOR_TDS_THRESHOLD : STANDARD_TDS_THRESHOLD;
        BigDecimal tdsDeducted = BigDecimal.ZERO;
        if (!Boolean.TRUE.equals(fd.getTdsExemptionForm15G()) && earnedInterest.compareTo(tdsThreshold) > 0) {
            tdsDeducted = earnedInterest.multiply(TDS_RATE).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal netPayout = fd.getDepositAmount().add(earnedInterest).subtract(tdsDeducted);

        boolean isLockInViolated = false;
        String lockInMsg = null;
        if ("FD_TAX_SAVER_5YR".equalsIgnoreCase(fd.getProductCode()) && completedMonths < 60) {
            isLockInViolated = true;
            lockInMsg = "Section 80C Tax Saver deposits carry a statutory 5-year lock-in period. Premature liquidation violates tax guidelines.";
        }

        return PrematureClosureQuoteDto.builder()
                .depositId(fd.getId())
                .certificateNumber(fd.getCertificateNumber())
                .customerName(fd.getCustomer().getFullName())
                .originalPrincipal(fd.getDepositAmount())
                .originalInterestRate(contractedRate)
                .contractedTenureMonths(fd.getTenureMonths())
                .completedMonths(completedMonths)
                .prematurePenaltyPercentage(penaltyPercentage)
                .revisedPenalizedInterestRate(penalizedRate)
                .earnedInterestAmount(earnedInterest)
                .penaltyAmountDeducted(penaltyDeducted)
                .tdsDeducted(tdsDeducted)
                .netPayoutAmount(netPayout)
                .payoutDestinationAccount(fd.getPayoutAccountNumber() != null ? fd.getPayoutAccountNumber() : fd.getSourceAccount().getAccountNumber())
                .quoteTimestamp(LocalDateTime.now())
                .isLockInViolated(isLockInViolated)
                .lockInWarningMessage(lockInMsg)
                .build();
    }

    @Transactional
    public FixedDepositDto executePrematureClosure(PrematureClosureRequest request, User currentUser) {
        PrematureClosureQuoteDto quote = getPrematureClosureQuote(request.getDepositId());

        FixedDeposit fd = fixedDepositRepository.findById(request.getDepositId())
                .orElseThrow(() -> new ResourceNotFoundException("FixedDeposit", "id", request.getDepositId()));

        String destinationAccNum = request.getPayoutAccountNumber() != null && !request.getPayoutAccountNumber().isBlank()
                ? request.getPayoutAccountNumber()
                : quote.getPayoutDestinationAccount();

        BankAccount destAccount = bankAccountRepository.findByAccountNumberForUpdate(destinationAccNum)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "accountNumber", destinationAccNum));

        // Credit customer account with net payout
        destAccount.setBalance(destAccount.getBalance().add(quote.getNetPayoutAmount()));
        destAccount.setAvailableBalance(destAccount.getAvailableBalance().add(quote.getNetPayoutAmount()));
        bankAccountRepository.save(destAccount);

        // Mark deposit prematurely closed
        fd.setStatus("PREMATURELY_CLOSED");
        fd.setClosedAt(LocalDateTime.now());
        fd.setClosedByUsername(currentUser != null ? currentUser.getUsername() : "CUSTOMER");
        fd.setPayoutAmount(quote.getNetPayoutAmount());
        fd.setPrematurePenaltyRate(quote.getPrematurePenaltyPercentage());
        fd.setPenaltyDeducted(quote.getPenaltyAmountDeducted());
        fd.setTaxDeductedAtSource(quote.getTdsDeducted());
        fd.setAccruedInterest(quote.getEarnedInterestAmount());
        FixedDeposit savedFd = fixedDepositRepository.save(fd);

        // Record Transaction
        String txnRef = "TXN-FD-CLOSE-" + System.currentTimeMillis();
        Transaction txn = Transaction.builder()
                .referenceNumber(txnRef)
                .destinationAccount(destAccount)
                .amount(quote.getNetPayoutAmount())
                .transactionType(TransactionType.FD_PREMATURE_WITHDRAWAL)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("CUSTOMER_PORTAL")
                .narration("Premature Deposit Liquidation: " + fd.getCertificateNumber())
                .initiatedBy(currentUser)
                .branch(fd.getBranch())
                .transactionTimestamp(LocalDateTime.now())
                .build();
        Transaction savedTxn = transactionRepository.save(txn);

        TransactionLedgerEntry creditEntry = TransactionLedgerEntry.builder()
                .transaction(savedTxn)
                .account(destAccount)
                .entryType("CREDIT")
                .amount(quote.getNetPayoutAmount())
                .runningBalance(destAccount.getBalance())
                .entryTimestamp(LocalDateTime.now())
                .build();
        ledgerEntryRepository.save(creditEntry);

        // Double-Entry General Ledger:
        // Debit: 2030-TERM-DEPOSITS-FD (Principal)
        // Credit: 2010-DEMAND-DEPOSITS-SAVINGS (Net Payout)
        // Credit: 4020-FEE-COMMISSION-INCOME (Penalty / Spread)
        accountingEngineService.postTransactionAccountingEntry(
                txnRef, "FD_PREMATURE_WITHDRAWAL", quote.getNetPayoutAmount(), fd.getBranch(), currentUser,
                "Premature liquidation of certificate " + fd.getCertificateNumber()
        );

        auditService.recordAudit(currentUser, "FD_PREMATURE_CLOSED", "TERM_DEPOSIT", fd.getCertificateNumber(),
                "Premature closure of " + fd.getCertificateNumber() + " | Payout: INR " + quote.getNetPayoutAmount() + " | Penalty: INR " + quote.getPenaltyAmountDeducted(),
                "127.0.0.1", "SUCCESS");

        return mapToDto(savedFd);
    }

    @Transactional
    public FixedDepositDto executeAutoRenewal(Long depositId, User currentUser) {
        FixedDeposit fd = fixedDepositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("FixedDeposit", "id", depositId));

        if (!"ACTIVE".equals(fd.getStatus()) && !"MATURED".equals(fd.getStatus())) {
            throw new BankingException("Only active or matured deposits can be rolled over. Current status: " + fd.getStatus());
        }

        // Rollover maturity corpus into a new term deposit
        BigDecimal newPrincipal = fd.getMaturityAmount();
        String newCertNo = "FD-" + fd.getBranch().getBranchCode() + "-" + System.currentTimeMillis();

        DepositCalculationRequest calcReq = DepositCalculationRequest.builder()
                .depositAmount(newPrincipal)
                .tenureMonths(fd.getTenureMonths())
                .depositType(fd.getDepositType())
                .isSeniorCitizen(fd.getIsSeniorCitizen())
                .tdsExemptionForm15G(fd.getTdsExemptionForm15G())
                .build();
        DepositCalculationResponse calcRes = calculateDeposit(calcReq);

        fd.setStatus("AUTO_RENEWED");
        fixedDepositRepository.save(fd);

        FixedDeposit renewedFd = FixedDeposit.builder()
                .certificateNumber(newCertNo)
                .customer(fd.getCustomer())
                .sourceAccount(fd.getSourceAccount())
                .branch(fd.getBranch())
                .productCode(fd.getProductCode())
                .depositType(fd.getDepositType())
                .depositAmount(newPrincipal)
                .interestRate(calcRes.getEffectiveInterestRate())
                .tenureMonths(fd.getTenureMonths())
                .compoundingFrequency("QUARTERLY")
                .isSeniorCitizen(fd.getIsSeniorCitizen())
                .seniorCitizenBonusRate(fd.getSeniorCitizenBonusRate())
                .maturityAmount(calcRes.getMaturityAmount())
                .totalInterestPayable(calcRes.getTotalInterestEarned())
                .depositDate(LocalDateTime.now())
                .maturityDate(LocalDateTime.now().plusMonths(fd.getTenureMonths()))
                .autoRenew(true)
                .nomineeName(fd.getNomineeName())
                .nomineeRelation(fd.getNomineeRelation())
                .payoutAccountNumber(fd.getPayoutAccountNumber())
                .status("ACTIVE")
                .build();

        FixedDeposit savedRenewed = fixedDepositRepository.save(renewedFd);

        auditService.recordAudit(currentUser, "FD_AUTO_RENEWED", "TERM_DEPOSIT", newCertNo,
                "Auto-renewed " + fd.getCertificateNumber() + " into new certificate " + newCertNo + " for INR " + newPrincipal,
                "127.0.0.1", "SUCCESS");

        return mapToDto(savedRenewed);
    }

    @Transactional(readOnly = true)
    public DepositCertificateDto getDepositCertificate(Long depositId) {
        FixedDeposit fd = fixedDepositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("FixedDeposit", "id", depositId));

        return DepositCertificateDto.builder()
                .certificateNumber(fd.getCertificateNumber())
                .depositType(fd.getDepositType() != null ? fd.getDepositType() : "FIXED_DEPOSIT")
                .productCode(fd.getProductCode() != null ? fd.getProductCode() : "FD_STANDARD_PRIME")
                .productName(fd.getProductCode() != null ? fd.getProductCode().replace('_', ' ') : "Term Deposit Certificate")
                .customerId(fd.getCustomer().getId())
                .customerName(fd.getCustomer().getFullName())
                .customerNumber(fd.getCustomer().getCustomerNumber())
                .sourceAccountNumber(fd.getSourceAccount() != null ? fd.getSourceAccount().getAccountNumber() : "N/A")
                .payoutAccountNumber(fd.getPayoutAccountNumber() != null ? fd.getPayoutAccountNumber() : "N/A")
                .branchCode(fd.getBranch().getBranchCode())
                .branchName(fd.getBranch().getName())
                .depositPrincipal(fd.getDepositAmount())
                .interestRate(fd.getInterestRate())
                .tenureMonths(fd.getTenureMonths())
                .compoundingFrequency(fd.getCompoundingFrequency() != null ? fd.getCompoundingFrequency() : "QUARTERLY")
                .projectedMaturityAmount(fd.getMaturityAmount())
                .totalInterestEarned(fd.getTotalInterestPayable())
                .depositDate(fd.getDepositDate())
                .maturityDate(fd.getMaturityDate())
                .autoRenew(fd.isAutoRenew())
                .nomineeName(fd.getNomineeName() != null ? fd.getNomineeName() : "Not Registered")
                .nomineeRelation(fd.getNomineeRelation() != null ? fd.getNomineeRelation() : "N/A")
                .isSeniorCitizen(Boolean.TRUE.equals(fd.getIsSeniorCitizen()))
                .tdsExemptionForm15G(Boolean.TRUE.equals(fd.getTdsExemptionForm15G()))
                .status(fd.getStatus())
                .authorizedSignatory("Apex National Bank Treasury Controller")
                .build();
    }

    @Transactional(readOnly = true)
    public Page<FixedDepositDto> getFixedDeposits(Long branchId, Long customerId, String status, String depositType, Pageable pageable) {
        Page<FixedDeposit> page = fixedDepositRepository.findFilteredDeposits(branchId, customerId, status, depositType, pageable);
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
                .depositType(fd.getDepositType() != null ? fd.getDepositType() : "FIXED_DEPOSIT")
                .productCode(fd.getProductCode())
                .depositAmount(fd.getDepositAmount())
                .interestRate(fd.getInterestRate())
                .tenureMonths(fd.getTenureMonths())
                .compoundingFrequency(fd.getCompoundingFrequency() != null ? fd.getCompoundingFrequency() : "QUARTERLY")
                .isSeniorCitizen(fd.getIsSeniorCitizen())
                .seniorCitizenBonusRate(fd.getSeniorCitizenBonusRate())
                .maturityAmount(fd.getMaturityAmount())
                .totalInterestPayable(fd.getTotalInterestPayable())
                .accruedInterest(fd.getAccruedInterest())
                .taxDeductedAtSource(fd.getTaxDeductedAtSource())
                .tdsExemptionForm15G(fd.getTdsExemptionForm15G())
                .depositDate(fd.getDepositDate())
                .maturityDate(fd.getMaturityDate())
                .autoRenew(fd.isAutoRenew())
                .nomineeName(fd.getNomineeName())
                .nomineeRelation(fd.getNomineeRelation())
                .payoutAccountNumber(fd.getPayoutAccountNumber())
                .status(fd.getStatus())
                .closedAt(fd.getClosedAt())
                .payoutAmount(fd.getPayoutAmount())
                .penaltyDeducted(fd.getPenaltyDeducted())
                .build();
    }

    private DepositProductDto mapProductToDto(DepositProductConfig p) {
        return DepositProductDto.builder()
                .id(p.getId())
                .productCode(p.getProductCode())
                .productName(p.getProductName())
                .depositType(p.getDepositType())
                .minAmount(p.getMinAmount())
                .maxAmount(p.getMaxAmount())
                .minTenureMonths(p.getMinTenureMonths())
                .maxTenureMonths(p.getMaxTenureMonths())
                .baseInterestRate(p.getBaseInterestRate())
                .seniorCitizenBonusRate(p.getSeniorCitizenBonusRate())
                .compoundingFrequency(p.getCompoundingFrequency())
                .prematurePenaltyRate(p.getPrematurePenaltyRate())
                .lockInMonths(p.getLockInMonths())
                .isTaxSaver(p.getIsTaxSaver())
                .description(p.getDescription())
                .isActive(p.getIsActive())
                .build();
    }
}
