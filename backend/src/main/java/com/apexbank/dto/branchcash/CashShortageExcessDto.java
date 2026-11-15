package com.apexbank.dto.branchcash;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashShortageExcessDto {
    private Long id;
    private String incidentNumber;
    private Long branchId;
    private String branchName;
    private Long drawerId;
    private String drawerCode;
    private Long cashierUserId;
    private String cashierUsername;
    private String incidentType;
    private BigDecimal expectedAmount;
    private BigDecimal physicalAmount;
    private BigDecimal varianceAmount;
    private String status;
    private String investigationNotes;
    private String resolvedByUsername;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
}
