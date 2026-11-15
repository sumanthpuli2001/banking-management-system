package com.apexbank.dto.loan;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanDto {
    private Long id;
    private String loanAccountNumber;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchName;
    private String loanType;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal monthlyEmi;
    private BigDecimal totalInterest;
    private BigDecimal totalPayable;
    private BigDecimal outstandingPrincipal;
    private BigDecimal totalRepaidPrincipal;
    private BigDecimal totalRepaidInterest;
    private String assetClassification;
    private Integer daysPastDue;
    private BigDecimal provisioningPercentage;
    private BigDecimal requiredProvisionAmount;
    private BigDecimal accruedPenalInterest;
    private String status;
    private LocalDateTime sanctionedDate;
    private LocalDateTime maturityDate;
    private LocalDateTime nextDueDate;
}
