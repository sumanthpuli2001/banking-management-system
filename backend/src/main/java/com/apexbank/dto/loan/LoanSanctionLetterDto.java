package com.apexbank.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanSanctionLetterDto {
    private Long id;
    private String sanctionReference;
    private Long loanApplicationId;
    private Long customerId;
    private String customerName;
    private BigDecimal sanctionedAmount;
    private BigDecimal approvedInterestRate;
    private Integer approvedTenureMonths;
    private BigDecimal monthlyEmi;
    private BigDecimal processingFeeAmount;
    private LocalDate sanctionDate;
    private LocalDate validityExpiryDate;
    private String approvingAuthorityLevel;
    private String sanctioningOfficerUsername;
    private String specialConditions;
    private String status;
}
