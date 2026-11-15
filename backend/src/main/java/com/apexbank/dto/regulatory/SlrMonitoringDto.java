package com.apexbank.dto.regulatory;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlrMonitoringDto {

    private LocalDate asOfDate;
    private String reportingFortnight;
    private BigDecimal ndtlAmount;
    private BigDecimal prescribedSlrRate; // e.g. 18.00%
    private BigDecimal requiredSlrAmount;

    // Breakdown of Eligible Liquid Assets
    private BigDecimal centralGovtSecuritiesValue;
    private BigDecimal stateDevLoansValue;
    private BigDecimal treasuryBillsValue;
    private BigDecimal physicalVaultCashValue;
    private BigDecimal excessCrrBalanceWithRbi;
    private BigDecimal sovereignGoldValue;
    private BigDecimal totalEligibleLiquidAssets;

    private BigDecimal actualSlrMaintenancePct;
    private BigDecimal surplusDeficitAmount;
    private String complianceStatus; // COMPLIANT, DEFICIT, MARGINAL_SURPLUS
    private boolean isCompliant;
    private String statutoryRuleReference; // Section 24 of Banking Regulation Act, 1949
    private List<EligibleLiquidAssetDto> qualifyingSecurities;
    private String notes;
}
