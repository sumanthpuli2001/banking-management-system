package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation_reports", indexes = {
    @Index(name = "idx_rec_rep_num", columnList = "report_number"),
    @Index(name = "idx_rec_rep_date", columnList = "run_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReconciliationReport extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_number", nullable = false, unique = true, length = 64)
    private String reportNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_type", nullable = false, length = 40)
    private ReconciliationType reconciliationType;

    @Column(name = "run_date", nullable = false)
    private LocalDate runDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "expected_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "actual_ledger_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal actualLedgerAmount;

    @Column(name = "discrepancy_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal discrepancyAmount;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // BALANCED, DISCREPANCY_FLAGGED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciled_by_user_id")
    private User reconciledBy;

    @Column(name = "details_json", columnDefinition = "TEXT")
    private String detailsJson;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
