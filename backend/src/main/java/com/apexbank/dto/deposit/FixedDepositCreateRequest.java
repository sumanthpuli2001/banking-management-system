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
    @DecimalMin(value = "5000.00", message = "Minimum Fixed Deposit is INR 5,000.00")
    private BigDecimal depositAmount;

    @NotNull(message = "Tenure is required")
    @Min(value = 6, message = "Minimum tenure is 6 months")
    private Integer tenureMonths;

    private boolean autoRenew;
}
