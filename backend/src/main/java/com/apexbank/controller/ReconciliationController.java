package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.reconciliation.ReconciliationExceptionDto;
import com.apexbank.dto.reconciliation.ReconciliationReportDto;
import com.apexbank.dto.reconciliation.ReconciliationSummaryDto;
import com.apexbank.dto.reconciliation.ResolveExceptionRequest;
import com.apexbank.entity.User;
import com.apexbank.service.ReconciliationService;
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

@RestController
@RequestMapping("/api/v1/reconciliation")
@Tag(name = "Transaction & Ledger Reconciliation Engine", description = "Endpoints for 5-point balance reconciliation, exception queues, and discrepancy resolution")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    public ReconciliationController(ReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR')")
    @Operation(summary = "Execute On-Demand 5-Point Institutional Reconciliation Cycle")
    public ResponseEntity<ApiResponse<List<ReconciliationReportDto>>> runReconciliation(@AuthenticationPrincipal User user) {
        List<ReconciliationReportDto> reports = reconciliationService.runComprehensiveReconciliation(user);
        return ResponseEntity.ok(ApiResponse.ok(reports, "5-point institutional reconciliation cycle executed successfully"));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Latest Reconciliation Health Summary & Indicators")
    public ResponseEntity<ApiResponse<ReconciliationSummaryDto>> getSummary() {
        ReconciliationSummaryDto summary = reconciliationService.getLatestSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Historical Reconciliation Reports")
    public ResponseEntity<ApiResponse<Page<ReconciliationReportDto>>> getReports(@PageableDefault(size = 20) Pageable pageable) {
        Page<ReconciliationReportDto> reports = reconciliationService.getAllReports(pageable);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Reconciliation Exception Queue")
    public ResponseEntity<ApiResponse<Page<ReconciliationExceptionDto>>> getExceptions(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ReconciliationExceptionDto> exceptions = reconciliationService.getExceptions(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(exceptions));
    }

    @PostMapping("/exceptions/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR')")
    @Operation(summary = "Investigate & Resolve Reconciliation Discrepancy")
    public ResponseEntity<ApiResponse<ReconciliationExceptionDto>> resolveException(
            @PathVariable Long id,
            @Valid @RequestBody ResolveExceptionRequest request,
            @AuthenticationPrincipal User user) {
        ReconciliationExceptionDto resolved = reconciliationService.resolveException(id, request.getResolutionNotes(), user);
        return ResponseEntity.ok(ApiResponse.ok(resolved, "Reconciliation exception resolved and audit log registered"));
    }
}
