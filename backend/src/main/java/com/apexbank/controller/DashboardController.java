package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.dashboard.HeadOfficeDashboardDto;
import com.apexbank.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Executive Dashboard & Analytics", description = "Consolidated Head Office and Branch operational and financial analytics")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Head Office Financial & Operational Summary", description = "Retrieves consolidated financial KPIs, branch performance, daily volumes, and maker-checker alert counts")
    public ResponseEntity<ApiResponse<HeadOfficeDashboardDto>> getHeadOfficeSummary() {
        HeadOfficeDashboardDto summary = dashboardService.getHeadOfficeSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary, "Dashboard metrics consolidated successfully"));
    }
}
