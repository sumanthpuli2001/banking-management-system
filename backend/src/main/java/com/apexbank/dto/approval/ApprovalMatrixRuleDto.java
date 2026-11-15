package com.apexbank.dto.approval;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalMatrixRuleDto {
    private Long id;
    private String ruleCode;
    private String ruleName;
    private String operationType;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String requiredCheckerRole;
    private String riskCategory;
    private Integer expiryHours;
    private Boolean isSelfApprovalAllowed;
    private Integer autoEscalateAfterHours;
    private String escalateToRole;
    private String description;
    private Boolean isActive;
}
