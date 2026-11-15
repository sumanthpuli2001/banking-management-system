package com.apexbank.dto.loan;

import jakarta.validation.constraints.DecimalMin;
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
public class RepaymentRequest {

    @NotNull(message = "Loan ID is required")
    private Long loanId;

    @NotNull(message = "Repayment amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least INR 1.00")
    private BigDecimal amount;

    private Long sourceAccountId; // Optional: if paid from savings account

    private String paymentMethod; // ACCOUNT_DEBIT, CASH_COUNTER

    private String narration;
}
