package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.compliance.*;
import com.apexbank.entity.User;
import com.apexbank.service.compliance.AmlMonitoringEngineService;
import com.apexbank.service.compliance.KycRiskManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/compliance")
@RequiredArgsConstructor
@Tag(name = "Compliance, KYC & AML Monitoring", description = "Endpoints for AML transaction alerts, investigation case management, KYC exceptions, and Enhanced Due Diligence")
public class ComplianceAmlController {

    private final AmlMonitoringEngineService amlService;
    private final KycRiskManagementService kycService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Compliance Dashboard Summary", description = "Retrieves high-level counts of active AML alerts, MLRO escalations, STR filings, and KYC exceptions")
    public ResponseEntity<ApiResponse<ComplianceDashboardSummaryDto>> getComplianceSummary() {
        ComplianceDashboardSummaryDto summary = amlService.getComplianceSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get AML Alerts Queue", description = "Retrieves paginated AML transaction monitoring alerts with severity and status filters")
    public ResponseEntity<ApiResponse<Page<AmlAlertDto>>> getAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String ruleCode,
            @PageableDefault(size = 15) Pageable pageable) {
        Page<AmlAlertDto> alerts = amlService.getAlerts(status, severity, ruleCode, pageable);
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    @GetMapping("/alerts/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get AML Alert Details", description = "Fetches a single AML alert dossier including full case notes history")
    public ResponseEntity<ApiResponse<AmlAlertDto>> getAlertById(@PathVariable Long id) {
        AmlAlertDto alert = amlService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.ok(alert));
    }

    @PostMapping("/alerts/{id}/action")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Process AML Case Action", description = "Transitions case status (INVESTIGATE, ESCALATE_MLRO, FILE_STR, CLOSE_FALSE_POSITIVE, CLOSE_EXPLAINED)")
    public ResponseEntity<ApiResponse<AmlAlertDto>> processCaseAction(
            @PathVariable Long id,
            @Valid @RequestBody AmlCaseActionRequest request,
            @AuthenticationPrincipal User currentUser) {
        String officer = currentUser != null ? currentUser.getUsername() : "COMPLIANCE_OFFICER";
        AmlAlertDto updated = amlService.processCaseAction(id, request, officer);
        return ResponseEntity.ok(ApiResponse.ok(updated, "AML case action processed successfully"));
    }

    @PostMapping("/alerts/{id}/notes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Add Investigation Case Note", description = "Appends an audit case note to the AML alert dossier")
    public ResponseEntity<ApiResponse<AmlCaseNoteDto>> addCaseNote(
            @PathVariable Long id,
            @RequestParam String noteText,
            @RequestParam(defaultValue = "INVESTIGATION_NOTE") String actionTaken,
            @RequestParam(defaultValue = "false") boolean isConfidential,
            @AuthenticationPrincipal User currentUser) {
        String officer = currentUser != null ? currentUser.getUsername() : "COMPLIANCE_OFFICER";
        AmlCaseNoteDto note = amlService.addCaseNote(id, noteText, actionTaken, isConfidential, officer);
        return ResponseEntity.ok(ApiResponse.ok(note, "Case note recorded successfully"));
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Configurable AML Rules", description = "Lists all active AML detection rules with thresholds and statutory references")
    public ResponseEntity<ApiResponse<List<AmlRuleConfigDto>>> getRuleConfigs() {
        List<AmlRuleConfigDto> rules = amlService.getRuleConfigs();
        return ResponseEntity.ok(ApiResponse.ok(rules));
    }

    @PutMapping("/rules/{ruleCode}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Update AML Rule Configuration", description = "Updates detection threshold amounts, lookback windows, and active state")
    public ResponseEntity<ApiResponse<AmlRuleConfigDto>> updateRuleConfig(
            @PathVariable String ruleCode,
            @RequestBody AmlRuleConfigDto updateDto,
            @AuthenticationPrincipal User currentUser) {
        String officer = currentUser != null ? currentUser.getUsername() : "SUPER_ADMIN";
        AmlRuleConfigDto updated = amlService.updateRuleConfig(ruleCode, updateDto, officer);
        return ResponseEntity.ok(ApiResponse.ok(updated, "AML detection rule updated successfully"));
    }

    @GetMapping("/kyc/exceptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get KYC Exception Queue", description = "Lists customers with overdue KYC reviews, pending EDD reviews, or expiring identity documents")
    public ResponseEntity<ApiResponse<Page<CustomerKycProfileDto>>> getKycExceptions(
            @PageableDefault(size = 15) Pageable pageable) {
        Page<CustomerKycProfileDto> exceptions = kycService.getKycExceptions(pageable);
        return ResponseEntity.ok(ApiResponse.ok(exceptions));
    }

    @GetMapping("/kyc/customers/{customerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'AUDITOR')")
    @Operation(summary = "Get Customer KYC Profile", description = "Retrieves complete KYC, CDD, EDD and review schedule for a customer")
    public ResponseEntity<ApiResponse<CustomerKycProfileDto>> getCustomerKycProfile(@PathVariable Long customerId) {
        CustomerKycProfileDto profile = kycService.getProfileByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PostMapping("/kyc/customers/{customerId}/edd")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Process Enhanced Due Diligence (EDD)", description = "Senior compliance officer sign-off for PEP and High-Risk customers")
    public ResponseEntity<ApiResponse<CustomerKycProfileDto>> processEddReview(
            @PathVariable Long customerId,
            @Valid @RequestBody EddReviewRequest request,
            @AuthenticationPrincipal User currentUser) {
        String officer = currentUser != null ? currentUser.getUsername() : "COMPLIANCE_HEAD";
        CustomerKycProfileDto profile = kycService.processEddReview(customerId, request, officer);
        return ResponseEntity.ok(ApiResponse.ok(profile, "Enhanced Due Diligence review recorded successfully"));
    }

    @PutMapping("/kyc/customers/{customerId}/risk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Update Customer Risk Classification", description = "Updates customer risk level (LOW, MEDIUM, HIGH, PEP) and recalculates review schedules")
    public ResponseEntity<ApiResponse<CustomerKycProfileDto>> updateRiskCategory(
            @PathVariable Long customerId,
            @RequestParam String riskCategory,
            @AuthenticationPrincipal User currentUser) {
        String officer = currentUser != null ? currentUser.getUsername() : "COMPLIANCE_OFFICER";
        CustomerKycProfileDto profile = kycService.updateRiskCategory(customerId, riskCategory, officer);
        return ResponseEntity.ok(ApiResponse.ok(profile, "Customer risk category updated successfully"));
    }
}
