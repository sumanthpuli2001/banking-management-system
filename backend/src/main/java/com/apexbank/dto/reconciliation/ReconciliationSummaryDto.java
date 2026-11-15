package com.apexbank.dto.reconciliation;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationSummaryDto {
    private LocalDateTime lastRunTimestamp;
    private boolean overallHealthy;
    private long openExceptionsCount;
    private BigDecimal totalDiscrepancy;
    private List<ReconciliationReportDto> latestReports;
}
