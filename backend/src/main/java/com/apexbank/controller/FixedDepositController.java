package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.deposit.*;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/deposits")
@Tag(name = "Term Deposits & Treasury", description = "Endpoints for Fixed Deposit (FD) and Recurring Deposit (RD) lifecycle, compounding, premature closure, certificates, and taxation")
public class FixedDepositController {

    private final FixedDepositService fixedDepositService;

    public FixedDepositController(FixedDepositService fixedDepositService) {
        this.fixedDepositService = fixedDepositService;
    }

    @GetMapping("/products")
    @Operation(summary = "Get Deposit Products", description = "Retrieves active Fixed and Recurring Deposit products, rate slabs, and tenure constraints")
    public ResponseEntity<ApiResponse<List<DepositProductDto>>> getProducts() {
        List<DepositProductDto> products = fixedDepositService.getActiveDepositProducts();
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @PostMapping("/calculate")
    @Operation(summary = "Calculate Compound Interest & TDS", description = "Pure BigDecimal compound calculation with quarterly compounding, senior citizen bonus, and Section 194A TDS forecast")
    public ResponseEntity<ApiResponse<DepositCalculationResponse>> calculateDeposit(@Valid @RequestBody DepositCalculationRequest request) {
        DepositCalculationResponse response = fixedDepositService.calculateDeposit(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/term")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER')")
    @Operation(summary = "Open Fixed/Recurring Deposit", description = "Creates a term fixed or recurring deposit with double-entry accounting (DR 2010 / CR 2030 or 2040) and issues deposit certificate")
    public ResponseEntity<ApiResponse<FixedDepositDto>> createFixedDeposit(
            @Valid @RequestBody FixedDepositCreateRequest request,
            @AuthenticationPrincipal User user) {
        FixedDepositDto fd = fixedDepositService.createFixedDeposit(request, user);
        return ResponseEntity.ok(ApiResponse.ok(fd, "Term Deposit opened and certificate issued successfully"));
    }

    @GetMapping("/term")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Term Deposits", description = "Retrieves term deposits with branch, customer, status, and deposit type filters")
    public ResponseEntity<ApiResponse<Page<FixedDepositDto>>> getFixedDeposits(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String depositType,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FixedDepositDto> fds = fixedDepositService.getFixedDeposits(branchId, customerId, status, depositType, pageable);
        return ResponseEntity.ok(ApiResponse.ok(fds));
    }

    @GetMapping("/term/{id}/certificate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER', 'AUDITOR')")
    @Operation(summary = "Get Deposit Certificate", description = "Generates official printable Certificate of Deposit with deposit terms, nominee details, and legal verification seal")
    public ResponseEntity<ApiResponse<DepositCertificateDto>> getDepositCertificate(@PathVariable Long id) {
        DepositCertificateDto cert = fixedDepositService.getDepositCertificate(id);
        return ResponseEntity.ok(ApiResponse.ok(cert));
    }

    @GetMapping("/term/{id}/premature-quote")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER')")
    @Operation(summary = "Get Premature Liquidation Quote", description = "Simulates premature closure penalty deduction, revised earned interest, TDS, and net payout before execution")
    public ResponseEntity<ApiResponse<PrematureClosureQuoteDto>> getPrematureClosureQuote(@PathVariable Long id) {
        PrematureClosureQuoteDto quote = fixedDepositService.getPrematureClosureQuote(id);
        return ResponseEntity.ok(ApiResponse.ok(quote));
    }

    @PostMapping("/term/premature-close")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER')")
    @Operation(summary = "Execute Premature Deposit Closure", description = "Executes premature liquidation with penalty deduction, TDS deduction, double-entry GL adjustment, and customer account credit")
    public ResponseEntity<ApiResponse<FixedDepositDto>> executePrematureClosure(
            @Valid @RequestBody PrematureClosureRequest request,
            @AuthenticationPrincipal User user) {
        FixedDepositDto fd = fixedDepositService.executePrematureClosure(request, user);
        return ResponseEntity.ok(ApiResponse.ok(fd, "Deposit prematurely closed and net payout credited to customer account"));
    }

    @PostMapping("/term/{id}/auto-renew")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'CUSTOMER')")
    @Operation(summary = "Execute Deposit Auto-Renewal", description = "Rolls over matured deposit corpus into a new term deposit at prevailing card rates")
    public ResponseEntity<ApiResponse<FixedDepositDto>> executeAutoRenewal(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        FixedDepositDto renewed = fixedDepositService.executeAutoRenewal(id, user);
        return ResponseEntity.ok(ApiResponse.ok(renewed, "Term deposit successfully renewed for a new tenure term"));
    }
}
