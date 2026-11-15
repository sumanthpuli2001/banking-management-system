package com.apexbank.dto.regulatory;

import com.apexbank.entity.regulatory.LiquidityAlert;
import com.apexbank.entity.regulatory.RegulatoryConfig;
import com.apexbank.entity.regulatory.RegulatoryReportingPeriod;
import com.apexbank.entity.regulatory.ReserveCalculationHistory;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulatoryDashboardDto {

    private LocalDate asOfDate;
    private String activeReportingPeriod;
    private String calculationClassification; // INTERNAL_ESTIMATE, SIMULATED_REGULATORY, AUDITED_STATUTORY
    private boolean isRegulatoryVerified;
    private String complianceBadgeTitle;

    // NDTL Core
    private BigDecimal ndtlAmount;
    private NdtlCalculationBreakdownDto ndtlBreakdown;

    // CRR & SLR Core
    private CrrMonitoringDto crrPosition;
    private SlrMonitoringDto slrPosition;

    // Aggregates
    private BigDecimal totalLiquidReserves;
    private BigDecimal compositeReserveRatio; // (CRR + SLR maintained) / NDTL

    // Collections
    private List<EligibleLiquidAssetDto> liquidAssets;
    private List<LiquidityAlert> activeAlerts;
    private List<RegulatoryConfig> regulatoryConfigs;
    private List<RegulatoryReportingPeriod> reportingPeriods;
    private List<ReserveCalculationHistory> recentCalculations;
}
