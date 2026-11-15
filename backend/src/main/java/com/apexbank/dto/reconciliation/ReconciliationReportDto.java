package com.apexbank.dto.reconciliation;

import com.apexbank.entity.ReconciliationType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationReportDto {
    private Long id;
    private String reportNumber;
    private ReconciliationType reconciliationType;
    private LocalDate runDate;
    private Long branchId;
    private String branchName;
    private BigDecimal expectedAmount;
    private BigDecimal actualLedgerAmount;
    private BigDecimal discrepancyAmount;
    private String status;
    private String reconciledByUsername;
    private String detailsJson;
    private LocalDateTime createdAt;
}
