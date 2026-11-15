package com.apexbank.controller;

import com.apexbank.dto.approval.*;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.entity.User;
import com.apexbank.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/approvals")
@Tag(name = "Maker-Checker Approval Hub", description = "Centralized dual-authorization portal for pending financial and administrative requests")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Approval Matrix Rules", description = "Retrieves active dual-control matrix rules and discretionary tiers")
    public ResponseEntity<ApiResponse<List<ApprovalMatrixRuleDto>>> getMatrixRules() {
        List<ApprovalMatrixRuleDto> rules = approvalService.getAllRules();
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Pending Approvals Queue", description = "Retrieves pending maker-checker authorization requests")
    public ResponseEntity<ApiResponse<Page<ApprovalRequestDto>>> getPendingApprovals(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String requiredRole,
            @RequestParam(required = false) String riskLevel,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ApprovalRequestDto> pending = approvalService.getPendingApprovals(branchId, requiredRole, riskLevel, pageable);
        return ResponseEntity.ok(ApiResponse.ok(pending));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Approval History", description = "Retrieves completed (APPROVED, REJECTED, EXPIRED) requests")
    public ResponseEntity<ApiResponse<Page<ApprovalRequestDto>>> getApprovalHistory(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ApprovalRequestDto> history = approvalService.getApprovalHistory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Approval Queue Summary", description = "Retrieves operational metrics for maker-checker queue")
    public ResponseEntity<ApiResponse<ApprovalQueueSummaryDto>> getQueueSummary() {
        ApprovalQueueSummaryDto summary = approvalService.getQueueSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Approval Audit Logs", description = "Retrieves audit trail events for an approval request")
    public ResponseEntity<ApiResponse<List<ApprovalAuditLogDto>>> getAuditLogs(@PathVariable Long id) {
        List<ApprovalAuditLogDto> logs = approvalService.getAuditLogsForRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @PostMapping("/{id}/decide")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Authorize or Reject Request", description = "Submits checker decision (APPROVED / REJECTED) with maker-checker segregation enforced")
    public ResponseEntity<ApiResponse<ApprovalRequestDto>> decide(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal User user) {
        ApprovalRequestDto result = approvalService.processDecision(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok(result, "Decision recorded and workflow updated"));
    }

    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Escalate Pending Approval", description = "Escalates pending request to higher authority tier")
    public ResponseEntity<ApiResponse<ApprovalRequestDto>> escalate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Manual operational escalation";
        ApprovalRequestDto result = approvalService.escalatePendingRequest(id, reason, user);
        return ResponseEntity.ok(ApiResponse.ok(result, "Request escalated to higher authority tier"));
    }

    @PostMapping("/sweep-expired")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Trigger SLA Expiry Sweep", description = "Sweeps overdue pending requests and marks them as EXPIRED")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sweepExpired() {
        int count = approvalService.sweepExpiredRequests();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("expiredCount", count, "status", "SWEEP_COMPLETE"), "SLA Expiry sweep completed"));
    }
}
