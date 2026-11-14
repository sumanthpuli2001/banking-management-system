package com.apexbank.controller;

import com.apexbank.dto.approval.ApprovalDecisionRequest;
import com.apexbank.dto.approval.ApprovalRequestDto;
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

@RestController
@RequestMapping("/api/v1/approvals")
@Tag(name = "Maker-Checker Approval Hub", description = "Centralized dual-authorization portal for pending financial and administrative requests")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Pending Approvals Queue", description = "Retrieves pending maker-checker authorization requests")
    public ResponseEntity<ApiResponse<Page<ApprovalRequestDto>>> getPendingApprovals(
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ApprovalRequestDto> pending = approvalService.getPendingApprovals(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(pending));
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
}
