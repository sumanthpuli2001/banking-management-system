package com.apexbank.dto.regulatory;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrrMonitoringDto {

    private LocalDate asOfDate;
    private String reportingFortnight;
    private BigDecimal ndtlAmount;
    private BigDecimal prescribedCrrRate; // e.g. 4.50%
    private BigDecimal minimumDailyMaintenancePct; // e.g. 90.00%
    private BigDecimal requiredCrrAmount;
    private BigDecimal minimumDailyRequiredAmount;
    private BigDecimal actualBalanceWithRbi; // from GL 1040
    private BigDecimal surplusDeficitAmount;
    private BigDecimal actualMaintenancePct;
    private String complianceStatus; // COMPLIANT, DEFICIT, MARGINAL_SURPLUS
    private boolean isCompliant;
    private String statutoryRuleReference; // Section 42(1) of RBI Act, 1934
    private String notes;
}
