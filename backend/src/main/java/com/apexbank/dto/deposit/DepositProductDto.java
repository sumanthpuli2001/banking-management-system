package com.apexbank.dto.deposit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositProductDto {
    private Long id;
    private String productCode;
    private String productName;
    private String depositType;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Integer minTenureMonths;
    private Integer maxTenureMonths;
    private BigDecimal baseInterestRate;
    private BigDecimal seniorCitizenBonusRate;
    private String compoundingFrequency;
    private BigDecimal prematurePenaltyRate;
    private Integer lockInMonths;
    private Boolean isTaxSaver;
    private String description;
    private Boolean isActive;
}
