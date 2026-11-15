package com.apexbank.entity.approval;

import com.apexbank.entity.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "approval_matrix_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalMatrixRule extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 50)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType; // HIGH_VALUE_TRANSFER, LOAN_SANCTION, ACCOUNT_FREEZE, ACCOUNT_CLOSURE, CONFIGURATION_CHANGE, CASH_LIMIT_OVERRIDE

    @Column(name = "min_amount", precision = 18, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", precision = 18, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "required_checker_role", nullable = false, length = 50)
    private String requiredCheckerRole; // BRANCH_MANAGER, REGIONAL_MANAGER, HEAD_OFFICE_ADMIN, SUPER_ADMIN

    @Column(name = "risk_category", nullable = false, length = 20)
    @Builder.Default
    private String riskCategory = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "expiry_hours", nullable = false)
    @Builder.Default
    private Integer expiryHours = 24;

    @Column(name = "is_self_approval_allowed", nullable = false)
    @Builder.Default
    private Boolean isSelfApprovalAllowed = false;

    @Column(name = "auto_escalate_after_hours")
    @Builder.Default
    private Integer autoEscalateAfterHours = 12;

    @Column(name = "escalate_to_role", length = 50)
    private String escalateToRole;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
