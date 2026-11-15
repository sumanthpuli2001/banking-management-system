package com.apexbank.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmlRuleConfigDto {
    private Long id;
    private String ruleCode;
    private String ruleName;
    private String severity;
    private BigDecimal thresholdAmount;
    private Integer lookbackHours;
    private BigDecimal multiplier;
    private String description;
    private Boolean isActive;
    private Boolean isRegulatoryReportRequired;
    private String statutoryReference;
    private String updatedByOfficer;
    private LocalDateTime effectiveFrom;
}
