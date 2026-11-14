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
public class CashDepositRequest {

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "1.00", message = "Minimum deposit is INR 1.00")
    private BigDecimal amount;

    private Integer notes2000;
    private Integer notes500;
    private Integer notes200;
    private Integer notes100;

    private String depositorName;
    private String depositorPhone;
    private String narration;
}
