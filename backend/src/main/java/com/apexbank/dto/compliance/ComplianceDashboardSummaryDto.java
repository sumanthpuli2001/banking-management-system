package com.apexbank.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDashboardSummaryDto {
    private long totalAlerts;
    private long newAlerts;
    private long underInvestigation;
    private long escalatedMlro;
    private long strFiled;
    private long closedCases;
    private long highSeverityAlerts;
    private long overdueKycReviews;
    private long pendingEddReviews;
}
