package com.apexbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_branch", columnList = "branch_id"),
    @Index(name = "idx_audit_timestamp", columnList = "event_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "branch_name", length = 120)
    private String branchName;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "module", nullable = false, length = 80)
    private String module;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "event_timestamp", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime eventTimestamp = LocalDateTime.now();
}
