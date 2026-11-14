package com.apexbank.dto.loan;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanApplicationDto {
    private Long id;
    private String applicationNumber;
    private Long customerId;
    private String customerName;
    private String customerNumber;
    private Long branchId;
    private String branchName;
    private String loanType;
    private BigDecimal requestedAmount;
    private Integer requestedTenureMonths;
    private String purpose;
    private BigDecimal monthlyIncome;
    private Integer creditScore;
    private String status;
    private String remarks;
    private LocalDateTime applicationDate;
}
