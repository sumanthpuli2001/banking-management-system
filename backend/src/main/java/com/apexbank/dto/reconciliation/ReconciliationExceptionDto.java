package com.apexbank.dto.reconciliation;

import com.apexbank.entity.ReconciliationType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationExceptionDto {
    private Long id;
    private String exceptionNumber;
    private ReconciliationType reconciliationType;
    private String entityType;
    private String entityIdentifier;
    private BigDecimal expectedAmount;
    private BigDecimal actualAmount;
    private BigDecimal discrepancyAmount;
    private String status;
    private String resolutionNotes;
    private String resolvedByUsername;
    private LocalDateTime detectedAt;
    private LocalDateTime resolvedAt;
}
