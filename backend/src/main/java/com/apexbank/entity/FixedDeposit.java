package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fixed_deposits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FixedDeposit extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "certificate_number", nullable = false, unique = true, length = 40)
    private String certificateNumber; // FD-2026-XXXX or RD-2026-XXXX

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_account_id")
    private BankAccount sourceAccount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "product_code", length = 40)
    private String productCode;

    @Column(name = "deposit_type", length = 30)
    @Builder.Default
    private String depositType = "FIXED_DEPOSIT"; // FIXED_DEPOSIT, RECURRING_DEPOSIT

    @Column(name = "deposit_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "monthly_installment_amount", precision = 18, scale = 2)
    private BigDecimal monthlyInstallmentAmount;

    @Column(name = "installments_paid")
    @Builder.Default
    private Integer installmentsPaid = 1;

    @Column(name = "total_installments")
    private Integer totalInstallments;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "compounding_frequency", length = 20)
    @Builder.Default
    private String compoundingFrequency = "QUARTERLY";

    @Column(name = "is_senior_citizen")
    @Builder.Default
    private Boolean isSeniorCitizen = false;

    @Column(name = "senior_citizen_bonus_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal seniorCitizenBonusRate = BigDecimal.ZERO;

    @Column(name = "maturity_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal maturityAmount;

    @Column(name = "total_interest_payable", precision = 18, scale = 2)
    private BigDecimal totalInterestPayable;

    @Column(name = "accrued_interest", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accruedInterest = BigDecimal.ZERO;

    @Column(name = "tax_deducted_at_source", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxDeductedAtSource = BigDecimal.ZERO;

    @Column(name = "tds_exemption_form_15g")
    @Builder.Default
    private Boolean tdsExemptionForm15G = false;

    @Column(name = "deposit_date", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime depositDate = LocalDateTime.now();

    @Column(name = "maturity_date", columnDefinition = "DATETIME", nullable = false)
    private LocalDateTime maturityDate;

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private boolean autoRenew = false;

    @Column(name = "nominee_name", length = 100)
    private String nomineeName;

    @Column(name = "nominee_relation", length = 50)
    private String nomineeRelation;

    @Column(name = "payout_account_number", length = 34)
    private String payoutAccountNumber;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, MATURED, PREMATURELY_CLOSED, AUTO_RENEWED

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_username", length = 50)
    private String closedByUsername;

    @Column(name = "payout_amount", precision = 18, scale = 2)
    private BigDecimal payoutAmount;

    @Column(name = "premature_penalty_rate", precision = 5, scale = 2)
    private BigDecimal prematurePenaltyRate;

    @Column(name = "penalty_deducted", precision = 18, scale = 2)
    private BigDecimal penaltyDeducted;
}
