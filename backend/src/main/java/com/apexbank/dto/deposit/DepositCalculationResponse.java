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
public class DepositCalculationResponse {
    private String depositType;
    private BigDecimal principalAmount;
    private Integer tenureMonths;
    private BigDecimal contractedInterestRate;
    private BigDecimal seniorCitizenBonusRate;
    private BigDecimal effectiveInterestRate;
    private String compoundingFrequency;
    private BigDecimal totalInterestEarned;
    private BigDecimal maturityAmount;
    private BigDecimal projectedTdsAmount;
    private BigDecimal netMaturityAmount;
    private Boolean isSeniorCitizen;
    private Boolean isTdsApplicable;
}
