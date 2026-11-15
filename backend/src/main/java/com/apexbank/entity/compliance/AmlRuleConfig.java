package com.apexbank.entity.compliance;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "aml_rule_configs", indexes = {
        @Index(name = "idx_aml_rule_code", columnList = "rule_code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AmlRuleConfig extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 60)
    private String ruleCode; // e.g. RULE_LARGE_CASH_CTR, RULE_STRUCTURING_SMURF, RULE_RAPID_MOVEMENT

    @Column(name = "rule_name", nullable = false, length = 120)
    private String ruleName;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "threshold_amount", precision = 18, scale = 2)
    private BigDecimal thresholdAmount;

    @Column(name = "lookback_hours")
    @Builder.Default
    private Integer lookbackHours = 24;

    @Column(name = "multiplier", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal multiplier = BigDecimal.valueOf(3.0);

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_regulatory_report_required")
    @Builder.Default
    private Boolean isRegulatoryReportRequired = false;

    @Column(name = "statutory_reference", length = 120)
    private String statutoryReference; // e.g. PMLA 2002 Section 12, FIU-IND Master Circular

    @Column(name = "updated_by_officer", length = 60)
    private String updatedByOfficer;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;
}
