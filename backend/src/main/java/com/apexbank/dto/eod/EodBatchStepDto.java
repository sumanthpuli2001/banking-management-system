package com.apexbank.dto.eod;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EodBatchStepDto {
    private Long id;
    private Long batchRunId;
    private Integer stepNumber;
    private String stepCode;
    private String stepName;
    private String status;
    private Long durationMs;
    private String details;
    private LocalDateTime executedAt;
}
