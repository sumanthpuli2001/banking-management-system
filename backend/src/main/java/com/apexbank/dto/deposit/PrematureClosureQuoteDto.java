package com.apexbank.dto.deposit;

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
public class PrematureClosureQuoteDto {
    private Long depositId;
    private String certificateNumber;
    private String customerName;
    private BigDecimal originalPrincipal;
    private BigDecimal originalInterestRate;
    private Integer contractedTenureMonths;
    private Integer completedMonths;
    private BigDecimal prematurePenaltyPercentage;
    private BigDecimal revisedPenalizedInterestRate;
    private BigDecimal earnedInterestAmount;
    private BigDecimal penaltyAmountDeducted;
    private BigDecimal tdsDeducted;
    private BigDecimal netPayoutAmount;
    private String payoutDestinationAccount;
    private LocalDateTime quoteTimestamp;
    private Boolean isLockInViolated;
    private String lockInWarningMessage;
}
