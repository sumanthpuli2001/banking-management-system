package com.apexbank.dto.approval;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequestDto {
    private Long id;
    private String requestType;
    private String ruleCode;
    private String requiredRole;
    private String riskLevel;
    private String targetEntityName;
    private Long targetEntityId;
    private Long makerId;
    private String makerName;
    private String makerRole;
    private Long checkerId;
    private String checkerName;
    private Long branchId;
    private String branchName;
    private BigDecimal amount;
    private String payloadJson;
    private String status;
    private String makerRemarks;
    private String checkerRemarks;
    private String rejectionReason;
    private Boolean isEscalated;
    private LocalDateTime escalatedAt;
    private String escalatedToRole;
    private String delegatedToUsername;
    private LocalDateTime requestedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime decidedAt;
    private Boolean isOverdue;
}
