package com.apexbank.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NpaPortfolioSummaryDto {
    private long totalLoans;
    private BigDecimal grossAdvances;
    private long standardCount;
    private BigDecimal standardAmount;
    private long sma0Count;
    private BigDecimal sma0Amount;
    private long sma1Count;
    private BigDecimal sma1Amount;
    private long sma2Count;
    private BigDecimal sma2Amount;
    private long substandardNpaCount;
    private BigDecimal substandardNpaAmount;
    private long doubtfulNpaCount;
    private BigDecimal doubtfulNpaAmount;
    private long lossAssetCount;
    private BigDecimal lossAssetAmount;
    private BigDecimal grossNpaRatioPercentage;
    private BigDecimal netNpaRatioPercentage;
    private BigDecimal totalRequiredProvisions;
}
