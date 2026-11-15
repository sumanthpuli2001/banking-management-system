package com.apexbank.entity.eod;

import com.apexbank.entity.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "eod_batch_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EodBatchStep extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_run_id", nullable = false)
    private Long batchRunId;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "step_code", nullable = false, length = 60)
    private String stepCode;

    @Column(name = "step_name", nullable = false, length = 100)
    private String stepName;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED, SKIPPED

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "details", length = 500)
    private String details;

    @Column(name = "executed_at", columnDefinition = "DATETIME")
    @Builder.Default
    private LocalDateTime executedAt = LocalDateTime.now();
}
