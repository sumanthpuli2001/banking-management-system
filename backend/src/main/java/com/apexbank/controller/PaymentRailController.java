package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.paymentrail.PaymentRailConfigDto;
import com.apexbank.dto.paymentrail.PaymentRailRequestDto;
import com.apexbank.dto.paymentrail.PaymentRailResponseDto;
import com.apexbank.dto.paymentrail.SimulationReconcileRequestDto;
import com.apexbank.entity.User;
import com.apexbank.entity.paymentrail.PaymentRailStatus;
import com.apexbank.entity.paymentrail.PaymentRailType;
import com.apexbank.service.paymentrail.PaymentRailRouterService;
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
@RequestMapping("/api/v1/payments")
@Tag(name = "Payment Rail Operations", description = "Endpoints for Internal, NEFT, RTGS, and IMPS payment execution, simulation, and reconciliation")
public class PaymentRailController {

    private final PaymentRailRouterService paymentRouterService;

    public PaymentRailController(PaymentRailRouterService paymentRouterService) {
        this.paymentRouterService = paymentRouterService;
    }

    @PostMapping("/process")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'CUSTOMER')")
    @Operation(summary = "Process Payment via Selected Rail", description = "Routes transaction to Internal, NEFT, RTGS, or IMPS adapter with simulation capabilities and double-entry accounting")
    public ResponseEntity<ApiResponse<PaymentRailResponseDto>> processPayment(
            @Valid @RequestBody PaymentRailRequestDto request,
            @AuthenticationPrincipal User user) {
        PaymentRailResponseDto response = paymentRouterService.processPayment(request, user);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment routed and processed via " + response.getRailType() + " rail"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'CUSTOMER', 'AUDITOR')")
    @Operation(summary = "Get Payment Rail History", description = "Retrieves paginated history of all payment rail transactions with filter parameters")
    public ResponseEntity<ApiResponse<Page<PaymentRailResponseDto>>> getHistory(
            @RequestParam(required = false) PaymentRailType railType,
            @RequestParam(required = false) PaymentRailStatus status,
            @PageableDefault(size = 15) Pageable pageable) {
        Page<PaymentRailResponseDto> page = paymentRouterService.getRecentTransactions(railType, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/config")
    @Operation(summary = "Get Payment Rail Configurations", description = "Returns active limits, settlement schedules, and fees for INTERNAL, NEFT, RTGS, and IMPS")
    public ResponseEntity<ApiResponse<List<PaymentRailConfigDto>>> getConfigurations() {
        List<PaymentRailConfigDto> configs = paymentRouterService.getRailConfigurations();
        return ResponseEntity.ok(ApiResponse.ok(configs));
    }

    @GetMapping("/{reference}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'CUSTOMER', 'AUDITOR')")
    @Operation(summary = "Inquire Payment Status", description = "Fetches status details and lifecycle of a transaction by reference, UTR, or RRN")
    public ResponseEntity<ApiResponse<PaymentRailResponseDto>> getStatus(
            @PathVariable String reference) {
        PaymentRailResponseDto status = paymentRouterService.getTransactionByReference(reference);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @PostMapping("/{reference}/simulate-reconcile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Simulate Settlement Reconciliation", description = "Reconciles a pending or timed-out simulated payment to SETTLED, RECONCILED, or FAILED")
    public ResponseEntity<ApiResponse<PaymentRailResponseDto>> simulateReconcile(
            @PathVariable String reference,
            @Valid @RequestBody SimulationReconcileRequestDto request,
            @AuthenticationPrincipal User user) {
        PaymentRailResponseDto response = paymentRouterService.reconcilePendingSimulatedTransaction(reference, request, user);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment reconciliation updated to " + response.getStatus()));
    }
}
