package com.apexbank.dto.loan;

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
public class LoanApplicationRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    @NotBlank(message = "Loan type is required (PERSONAL, HOME, VEHICLE, EDUCATION, BUSINESS)")
    private String loanType;

    @NotNull(message = "Requested amount is required")
    @DecimalMin(value = "10000.00", message = "Minimum loan amount is INR 10,000.00")
    private BigDecimal requestedAmount;

    @NotNull(message = "Tenure is required")
    @Min(value = 6, message = "Minimum tenure is 6 months")
    private Integer requestedTenureMonths;

    private String purpose;
    private BigDecimal monthlyIncome;
}
