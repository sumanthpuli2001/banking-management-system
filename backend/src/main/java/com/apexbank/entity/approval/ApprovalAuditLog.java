package com.apexbank.entity.approval;

import com.apexbank.entity.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalAuditLog extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "approval_request_id", nullable = false)
    private Long approvalRequestId;

    @Column(name = "action", nullable = false, length = 40)
    private String action; // CREATED, APPROVED, REJECTED, ESCALATED, EXPIRED, DELEGATED

    @Column(name = "performed_by_username", nullable = false, length = 50)
    private String performedByUsername;

    @Column(name = "performed_by_role", length = 50)
    private String performedByRole;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "recorded_at", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
