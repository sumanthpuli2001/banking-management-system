package com.apexbank.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductDto {
    private Long id;
    private String productCode;
    private String productName;
    private String loanType;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Integer minTenureMonths;
    private Integer maxTenureMonths;
    private BigDecimal baseInterestRate;
    private BigDecimal processingFeePercentage;
    private BigDecimal maxFoirPercentage;
    private Integer minCreditScore;
    private Boolean collateralRequired;
    private String description;
    private Boolean isActive;
}
