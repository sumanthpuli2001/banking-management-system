package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.regulatory.*;
import com.apexbank.entity.User;
import com.apexbank.entity.regulatory.LiquidityAlert;
import com.apexbank.entity.regulatory.RegulatoryConfig;
import com.apexbank.entity.regulatory.ReserveCalculationHistory;
import com.apexbank.service.regulatory.RegulatoryLiquidityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/regulatory")
@Tag(name = "Regulatory & Liquidity Management", description = "Endpoints for Head Office CRR, SLR, NDTL calculations, reserve verification, and liquidity alerts")
public class RegulatoryLiquidityController {

    private final RegulatoryLiquidityService regulatoryService;

    public RegulatoryLiquidityController(RegulatoryLiquidityService regulatoryService) {
        this.regulatoryService = regulatoryService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Regulatory Liquidity Dashboard", description = "Retrieves consolidated CRR/SLR monitoring, dynamic NDTL breakdown, qualifying assets, and active compliance badges")
    public ResponseEntity<ApiResponse<RegulatoryDashboardDto>> getDashboard() {
        RegulatoryDashboardDto dashboard = regulatoryService.getRegulatoryDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    @GetMapping("/ndtl")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get NDTL Calculation Breakdown", description = "Provides detailed demand and time liability classification, interbank deductions, and applied RBI formulas")
    public ResponseEntity<ApiResponse<NdtlCalculationBreakdownDto>> getNdtlBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        NdtlCalculationBreakdownDto ndtl = regulatoryService.calculateNdtl(date);
        return ResponseEntity.ok(ApiResponse.ok(ndtl));
    }

    @GetMapping("/crr")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get CRR Position", description = "Retrieves Cash Reserve Ratio compliance status under Section 42(1) of RBI Act, 1934")
    public ResponseEntity<ApiResponse<CrrMonitoringDto>> getCrrPosition(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        NdtlCalculationBreakdownDto ndtl = regulatoryService.calculateNdtl(date);
        CrrMonitoringDto crr = regulatoryService.calculateCrrPosition(date, ndtl.getNetDemandTimeLiabilities());
        return ResponseEntity.ok(ApiResponse.ok(crr));
    }

    @GetMapping("/slr")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get SLR Position", description = "Retrieves Statutory Liquidity Ratio compliance and eligible unencumbered liquid asset holdings under Section 24 of BR Act, 1949")
    public ResponseEntity<ApiResponse<SlrMonitoringDto>> getSlrPosition(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        NdtlCalculationBreakdownDto ndtl = regulatoryService.calculateNdtl(date);
        CrrMonitoringDto crr = regulatoryService.calculateCrrPosition(date, ndtl.getNetDemandTimeLiabilities());
        SlrMonitoringDto slr = regulatoryService.calculateSlrPosition(date, ndtl.getNetDemandTimeLiabilities(), crr);
        return ResponseEntity.ok(ApiResponse.ok(slr));
    }

    @PostMapping("/simulate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Simulate Regulatory Calculation", description = "Runs simulated CRR/SLR calculations with configurable rates or stress scenario deposit outflows")
    public ResponseEntity<ApiResponse<ReserveCalculationHistory>> simulateCalculation(
            @Valid @RequestBody SimulateLiquidityCalculationRequest request,
            @AuthenticationPrincipal User user) {
        ReserveCalculationHistory result = regulatoryService.simulateCalculation(request, user);
        return ResponseEntity.ok(ApiResponse.ok(result, "Simulated regulatory reserve calculation executed"));
    }

    @PostMapping("/verify/{calculationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Verify and Sign Off Regulatory Report", description = "Promotes calculation from SIMULATED to AUDITED_STATUTORY with dual officer sign-off")
    public ResponseEntity<ApiResponse<ReserveCalculationHistory>> verifyCalculation(
            @PathVariable Long calculationId,
            @AuthenticationPrincipal User user) {
        ReserveCalculationHistory verified = regulatoryService.verifyAndSignOffReporting(calculationId, user);
        return ResponseEntity.ok(ApiResponse.ok(verified, "Statutory reserve report audited and signed off"));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update Regulatory Configuration", description = "Updates regulatory percentage rates, effective dates, and statutory source circulars")
    public ResponseEntity<ApiResponse<RegulatoryConfig>> updateConfig(
            @Valid @RequestBody UpdateRegulatoryConfigRequest request,
            @AuthenticationPrincipal User user) {
        RegulatoryConfig config = regulatoryService.updateRegulatoryConfig(request, user);
        return ResponseEntity.ok(ApiResponse.ok(config, "Regulatory parameter " + config.getParameterKey() + " updated successfully"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Reserve Calculation History", description = "Retrieves paginated audit log of historical reserve computations")
    public ResponseEntity<ApiResponse<Page<ReserveCalculationHistory>>> getHistory(
            @PageableDefault(size = 15) Pageable pageable) {
        Page<ReserveCalculationHistory> page = regulatoryService.getCalculationHistory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @PostMapping("/alerts/{alertId}/acknowledge")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Acknowledge Liquidity Alert", description = "Acknowledges active regulatory or liquidity buffer deficit alert")
    public ResponseEntity<ApiResponse<LiquidityAlert>> acknowledgeAlert(
            @PathVariable Long alertId,
            @AuthenticationPrincipal User user) {
        LiquidityAlert alert = regulatoryService.acknowledgeAlert(alertId, user);
        return ResponseEntity.ok(ApiResponse.ok(alert, "Liquidity alert acknowledged"));
    }
}
