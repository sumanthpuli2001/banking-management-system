package com.apexbank.dto.loan;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanRepaymentDto {
    private Long id;
    private Long loanId;
    private Integer installmentNumber;
    private BigDecimal emiAmount;
    private BigDecimal principalComponent;
    private BigDecimal interestComponent;
    private LocalDateTime dueDate;
    private LocalDateTime paidDate;
    private String status;
    private BigDecimal penaltyAmount;
    private String paymentReference;
}
