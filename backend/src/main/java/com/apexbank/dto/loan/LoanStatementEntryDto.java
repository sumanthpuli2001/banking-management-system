package com.apexbank.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanStatementEntryDto {
    private LocalDateTime timestamp;
    private String transactionReference;
    private String entryType; // DISBURSEMENT, EMI_REPAYMENT, PENAL_FEE
    private String narration;
    private BigDecimal principalPaid;
    private BigDecimal interestPaid;
    private BigDecimal feePaid;
    private BigDecimal totalAmount;
    private BigDecimal runningOutstandingBalance;
}
