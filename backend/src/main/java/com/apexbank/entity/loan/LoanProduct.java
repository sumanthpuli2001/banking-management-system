package com.apexbank.entity.loan;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "loan_products", indexes = {
        @Index(name = "idx_loan_product_code", columnList = "product_code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LoanProduct extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", nullable = false, unique = true, length = 50)
    private String productCode; // PROD_HOME_PRIME, PROD_AUTO_FLEX, PROD_PERSONAL_INSTANT, PROD_SME_GROWTH

    @Column(name = "product_name", nullable = false, length = 120)
    private String productName;

    @Column(name = "loan_type", nullable = false, length = 40)
    private String loanType; // HOME, VEHICLE, PERSONAL, BUSINESS, EDUCATION

    @Column(name = "min_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "min_tenure_months", nullable = false)
    private Integer minTenureMonths;

    @Column(name = "max_tenure_months", nullable = false)
    private Integer maxTenureMonths;

    @Column(name = "base_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal baseInterestRate; // Annual %

    @Column(name = "processing_fee_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal processingFeePercentage = new BigDecimal("1.00");

    @Column(name = "max_foir_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxFoirPercentage = new BigDecimal("50.00"); // Fixed Obligation to Income Ratio

    @Column(name = "min_credit_score")
    @Builder.Default
    private Integer minCreditScore = 650;

    @Column(name = "collateral_required")
    @Builder.Default
    private Boolean collateralRequired = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
