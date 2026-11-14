package com.apexbank.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashWithdrawalRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotNull(message = "Withdrawal amount is required")
    @DecimalMin(value = "1.00", message = "Minimum withdrawal is INR 1.00")
    private BigDecimal amount;

    private String narration;
}
