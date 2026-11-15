package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.eod.EodBatchRunDto;
import com.apexbank.dto.eod.EodExecutionResponseDto;
import com.apexbank.entity.User;
import com.apexbank.service.eod.EodBatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/api/v1/eod")
@Tag(name = "EOD & SOD Batch Closing Engine", description = "End-of-Day and Start-of-Day core banking automated batch execution")
public class EodBatchController {

    private final EodBatchService eodBatchService;

    public EodBatchController(EodBatchService eodBatchService) {
        this.eodBatchService = eodBatchService;
    }

    @PostMapping("/run")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Execute End-of-Day (EOD) Batch", description = "Executes multi-step automated EOD closing across branches, journals, interest accruals, and regulatory reserves")
    public ResponseEntity<ApiResponse<EodExecutionResponseDto>> runEod(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal User user) {
        EodExecutionResponseDto response = eodBatchService.executeEodBatch(date, user);
        return ResponseEntity.ok(ApiResponse.ok(response, "EOD Batch process completed"));
    }

    @PostMapping("/run-sod")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Execute Start-of-Day (SOD) Batch", description = "Initializes teller drawers, activates daily accounting period, and resets transaction counters")
    public ResponseEntity<ApiResponse<EodExecutionResponseDto>> runSod(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal User user) {
        EodExecutionResponseDto response = eodBatchService.executeSodBatch(date, user);
        return ResponseEntity.ok(ApiResponse.ok(response, "SOD Batch process completed"));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Latest Batch Run Status", description = "Retrieves the most recent EOD or SOD batch run execution details")
    public ResponseEntity<ApiResponse<EodBatchRunDto>> getLatest() {
        return eodBatchService.getLatestBatchRun()
                .map(run -> ResponseEntity.ok(ApiResponse.ok(run)))
                .orElse(ResponseEntity.ok(ApiResponse.ok(null, "No previous batch run found")));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Batch Execution History", description = "Retrieves chronological log of all historical EOD/SOD batch runs")
    public ResponseEntity<ApiResponse<Page<EodBatchRunDto>>> getHistory(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<EodBatchRunDto> history = eodBatchService.getBatchHistory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
