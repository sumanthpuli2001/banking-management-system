package com.apexbank.dto.branchcash;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchCashPositionDto {
    private Long branchId;
    private String branchCode;
    private String branchName;
    private BigDecimal vaultCashBalance;
    private int activeDrawersCount;
    private BigDecimal totalDrawersCashBalance;
    private BigDecimal totalBranchCash;
    private BigDecimal todayReceipts;
    private BigDecimal todayPayments;
    private BigDecimal netIntradayMovement;
    private BigDecimal inTransitIncoming;
    private BigDecimal inTransitOutgoing;
}
