package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reconciliation_exceptions", indexes = {
    @Index(name = "idx_rec_ex_num", columnList = "exception_number"),
    @Index(name = "idx_rec_ex_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReconciliationException extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exception_number", nullable = false, unique = true, length = 64)
    private String exceptionNumber; // REC-EX-20261115-XXXX

    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_type", nullable = false, length = 40)
    private ReconciliationType reconciliationType;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType; // BRANCH_VAULT, CUSTOMER_ACCOUNT, TRANSFER_LEG, DAILY_TOTAL

    @Column(name = "entity_identifier", nullable = false, length = 64)
    private String entityIdentifier; // BLR-001, ACC-1001001001, etc.

    @Column(name = "expected_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "actual_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "discrepancy_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal discrepancyAmount;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, INVESTIGATING, RESOLVED, WRITTEN_OFF

    @Column(name = "resolution_notes", length = 500)
    private String resolutionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedBy;

    @Column(name = "detected_at", nullable = false)
    @Builder.Default
    private LocalDateTime detectedAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
