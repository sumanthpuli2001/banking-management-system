package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.deposit.FixedDepositCreateRequest;
import com.apexbank.dto.deposit.FixedDepositDto;
import com.apexbank.entity.User;
import com.apexbank.service.FixedDepositService;
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
@RequestMapping("/api/v1/deposits")
@Tag(name = "Term Deposits & Treasury", description = "Endpoints for Fixed Deposit (FD) and Recurring Deposit (RD) lifecycle")
public class FixedDepositController {

    private final FixedDepositService fixedDepositService;

    public FixedDepositController(FixedDepositService fixedDepositService) {
        this.fixedDepositService = fixedDepositService;
    }

    @PostMapping("/term")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER')")
    @Operation(summary = "Open Fixed Deposit", description = "Creates a term fixed deposit with compound interest and issues deposit certificate")
    public ResponseEntity<ApiResponse<FixedDepositDto>> createFixedDeposit(
            @Valid @RequestBody FixedDepositCreateRequest request,
            @AuthenticationPrincipal User user) {
        FixedDepositDto fd = fixedDepositService.createFixedDeposit(request, user);
        return ResponseEntity.ok(ApiResponse.ok(fd, "Fixed Deposit opened and certificate issued successfully"));
    }

    @GetMapping("/term")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Fixed Deposits", description = "Retrieves active fixed deposits, filterable by branch or customer")
    public ResponseEntity<ApiResponse<Page<FixedDepositDto>>> getFixedDeposits(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long customerId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FixedDepositDto> fds = fixedDepositService.getFixedDeposits(branchId, customerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(fds));
    }
}
