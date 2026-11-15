package com.apexbank.dto.accounting;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosingDto {
    private Long id;
    private Long branchId;
    private String branchName;
    private LocalDate closingDate;
    private BigDecimal openingCash;
    private BigDecimal totalCashReceipts;
    private BigDecimal totalCashPayments;
    private BigDecimal expectedClosingCash;
    private BigDecimal physicalCashCounted;
    private BigDecimal discrepancy;
    private String status;
    private String cashierUsername;
    private String verifiedByUsername;
    private String notes;
    private LocalDateTime closedAt;
}
