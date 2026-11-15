package com.apexbank.entity.eod;

import com.apexbank.entity.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "eod_batch_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EodBatchRun extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_date", nullable = false)
    private LocalDate batchDate;

    @Column(name = "batch_type", nullable = false, length = 20)
    @Builder.Default
    private String batchType = "EOD"; // EOD, SOD

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, FAILED

    @Column(name = "branch_count_verified")
    private Integer branchCountVerified;

    @Column(name = "unbalanced_entries_count")
    @Builder.Default
    private Integer unbalancedEntriesCount = 0;

    @Column(name = "interest_accrual_total", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal interestAccrualTotal = BigDecimal.ZERO;

    @Column(name = "regulatory_reserve_calculated")
    @Builder.Default
    private Boolean regulatoryReserveCalculated = false;

    @Column(name = "initiated_by", length = 50)
    private String initiatedBy;

    @Column(name = "summary_notes", length = 500)
    private String summaryNotes;

    @Column(name = "started_at", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "completed_at", columnDefinition = "DATETIME")
    private LocalDateTime completedAt;
}
