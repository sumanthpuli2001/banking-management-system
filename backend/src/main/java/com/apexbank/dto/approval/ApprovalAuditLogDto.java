package com.apexbank.dto.approval;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalAuditLogDto {
    private Long id;
    private Long approvalRequestId;
    private String action;
    private String performedByUsername;
    private String performedByRole;
    private String notes;
    private LocalDateTime recordedAt;
}
