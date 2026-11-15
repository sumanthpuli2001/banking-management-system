package com.apexbank.dto.deposit;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositCalculationRequest {

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "500.00", message = "Minimum deposit amount is INR 500.00")
    private BigDecimal depositAmount;

    @NotNull(message = "Tenure in months is required")
    @Min(value = 3, message = "Minimum tenure is 3 months")
    private Integer tenureMonths;

    private String depositType; // FIXED_DEPOSIT, RECURRING_DEPOSIT

    private BigDecimal interestRate; // Optional override; otherwise fetched from product slab

    private String productCode;

    private Boolean isSeniorCitizen;

    private Boolean tdsExemptionForm15G;
}
