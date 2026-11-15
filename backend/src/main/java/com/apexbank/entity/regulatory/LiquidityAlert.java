package com.apexbank.entity.regulatory;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "liquidity_alerts", indexes = {
        @Index(name = "idx_alert_severity", columnList = "severity"),
        @Index(name = "idx_alert_ack", columnList = "is_acknowledged")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiquidityAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_type", nullable = false, length = 60)
    private String alertType; // CRR_MAINTENANCE_RISK, SLR_BUFFER_DEFICIT, NDTL_HIGH_SURGE, LIQUIDITY_RUN_RISK

    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // INFO, WARNING, CRITICAL_DEFICIT

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", nullable = false, length = 400)
    private String description;

    @Column(name = "metric_observed", length = 100)
    private String metricObserved;

    @Column(name = "regulatory_threshold", length = 100)
    private String regulatoryThreshold;

    @Column(name = "is_acknowledged", nullable = false)
    @Builder.Default
    private Boolean isAcknowledged = Boolean.FALSE;

    @Column(name = "acknowledged_by", length = 60)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "created_timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime createdTimestamp = LocalDateTime.now();
}
