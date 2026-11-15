package com.apexbank.dto.eod;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EodExecutionResponseDto {
    private boolean success;
    private String batchType;
    private Long batchRunId;
    private String status;
    private String message;
    private List<EodBatchStepDto> executedSteps;
}
