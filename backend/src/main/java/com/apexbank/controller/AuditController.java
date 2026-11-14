package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.entity.AuditLog;
import com.apexbank.entity.LoginHistory;
import com.apexbank.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit & Compliance Forensics", description = "Immutable audit ledger entries, security events, and login history")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Recent Immutable Audit Logs", description = "Retrieves recent system compliance entries with user, role, correlation ID, and status")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentLogs() {
        List<AuditLog> logs = auditService.getRecentAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/logins")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Recent Login History", description = "Retrieves authentication attempts, lockout records, and client user-agents")
    public ResponseEntity<ApiResponse<List<LoginHistory>>> getRecentLogins() {
        List<LoginHistory> logins = auditService.getRecentLoginHistory();
        return ResponseEntity.ok(ApiResponse.ok(logins));
    }
}
