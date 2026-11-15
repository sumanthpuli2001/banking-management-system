package com.apexbank.dto.eod;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EodBatchRunDto {
    private Long id;
    private LocalDate batchDate;
    private String batchType;
    private String status;
    private Integer branchCountVerified;
    private Integer unbalancedEntriesCount;
    private BigDecimal interestAccrualTotal;
    private Boolean regulatoryReserveCalculated;
    private String initiatedBy;
    private String summaryNotes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<EodBatchStepDto> steps;
}
