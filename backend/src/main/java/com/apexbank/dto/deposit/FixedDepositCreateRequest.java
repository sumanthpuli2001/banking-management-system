package com.apexbank.dto.deposit;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Source account number is required")
    private String sourceAccountNumber;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "500.00", message = "Minimum deposit amount is INR 500.00")
    private BigDecimal depositAmount;

    @NotNull(message = "Tenure is required")
    @Min(value = 3, message = "Minimum tenure is 3 months")
    private Integer tenureMonths;

    private String depositType; // FIXED_DEPOSIT, RECURRING_DEPOSIT

    private String productCode;

    private boolean autoRenew;

    private Boolean isSeniorCitizen;

    private Boolean tdsExemptionForm15G;

    private String nomineeName;

    private String nomineeRelation;

    private String payoutAccountNumber;
}
