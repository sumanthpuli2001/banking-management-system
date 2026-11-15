package com.apexbank.entity.deposit;

import com.apexbank.entity.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "deposit_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepositProductConfig extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", nullable = false, unique = true, length = 40)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "deposit_type", nullable = false, length = 30)
    @Builder.Default
    private String depositType = "FIXED_DEPOSIT"; // FIXED_DEPOSIT, RECURRING_DEPOSIT

    @Column(name = "min_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "min_tenure_months", nullable = false)
    private Integer minTenureMonths;

    @Column(name = "max_tenure_months", nullable = false)
    private Integer maxTenureMonths;

    @Column(name = "base_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal baseInterestRate;

    @Column(name = "senior_citizen_bonus_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal seniorCitizenBonusRate = new BigDecimal("0.50");

    @Column(name = "compounding_frequency", nullable = false, length = 20)
    @Builder.Default
    private String compoundingFrequency = "QUARTERLY"; // QUARTERLY, MONTHLY, SIMPLE

    @Column(name = "premature_penalty_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal prematurePenaltyRate = new BigDecimal("1.00");

    @Column(name = "lock_in_months")
    @Builder.Default
    private Integer lockInMonths = 0;

    @Column(name = "is_tax_saver", nullable = false)
    @Builder.Default
    private Boolean isTaxSaver = false;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
