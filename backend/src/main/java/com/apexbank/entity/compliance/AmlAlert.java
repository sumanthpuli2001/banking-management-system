package com.apexbank.entity.compliance;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "aml_alerts", indexes = {
        @Index(name = "idx_aml_alert_num", columnList = "alert_number", unique = true),
        @Index(name = "idx_aml_status", columnList = "status"),
        @Index(name = "idx_aml_severity", columnList = "severity"),
        @Index(name = "idx_aml_cust", columnList = "customer_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AmlAlert extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_number", nullable = false, unique = true, length = 50)
    private String alertNumber; // e.g., AML-20261115-0012

    @Column(name = "rule_code", nullable = false, length = 50)
    private String ruleCode; // RULE_LARGE_CASH_CTR, RULE_STRUCTURING_SMURF, RULE_RAPID_MOVEMENT, etc.

    @Column(name = "rule_name", nullable = false, length = 120)
    private String ruleName;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "NEW_ALERT"; // NEW_ALERT, UNDER_INVESTIGATION, ESCALATED_TO_MLRO, STR_FILED, CLOSED_FALSE_POSITIVE, CLOSED_EXPLAINED

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "customer_number", length = 40)
    private String customerNumber;

    @Column(name = "customer_name", length = 120)
    private String customerName;

    @Column(name = "customer_risk_category", length = 30)
    private String customerRiskCategory; // LOW, MEDIUM, HIGH, PEP

    @Column(name = "account_number", length = 40)
    private String accountNumber;

    @Column(name = "transaction_reference", length = 64)
    private String transactionReference;

    @Column(name = "transaction_amount", precision = 18, scale = 4)
    private BigDecimal transactionAmount;

    @Column(name = "transaction_type", length = 40)
    private String transactionType;

    @Column(name = "detection_score")
    @Builder.Default
    private Integer detectionScore = 80; // Risk score 1 - 100

    @Column(name = "trigger_details", columnDefinition = "TEXT")
    private String triggerDetails;

    @Column(name = "assigned_officer", length = 60)
    private String assignedOfficer;

    @Column(name = "fiu_str_reference", length = 80)
    private String fiuStrReference; // FIU-IND Suspicious Transaction Report reference

    @Column(name = "detected_timestamp", nullable = false)
    private LocalDateTime detectedTimestamp;

    @Column(name = "escalated_timestamp")
    private LocalDateTime escalatedTimestamp;

    @Column(name = "closed_timestamp")
    private LocalDateTime closedTimestamp;

    @Column(name = "closure_reason", length = 255)
    private String closureReason;
}
