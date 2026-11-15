package com.apexbank.controller;

import com.apexbank.dto.branchcash.*;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.reconciliation.ResolveExceptionRequest;
import com.apexbank.entity.User;
import com.apexbank.service.BranchCashManagementService;
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
@RequestMapping("/api/v1/branch-cash")
@Tag(name = "Branch Cash & Inter-Branch Settlement", description = "Endpoints for teller cash drawers, vault cash positions, teller handovers, cash variances, and inter-branch cash shipments")
public class BranchCashManagementController {

    private final BranchCashManagementService branchCashService;

    public BranchCashManagementController(BranchCashManagementService branchCashService) {
        this.branchCashService = branchCashService;
    }

    @GetMapping("/positions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get All Branch Cash Positions", description = "Retrieves live vault cash balances, active teller drawers, intraday inflows, and transit totals across branches")
    public ResponseEntity<ApiResponse<List<BranchCashPositionDto>>> getAllPositions() {
        List<BranchCashPositionDto> positions = branchCashService.getAllBranchCashPositions();
        return ResponseEntity.ok(ApiResponse.ok(positions));
    }

    @GetMapping("/positions/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR', 'CASHIER')")
    @Operation(summary = "Get Specific Branch Cash Position")
    public ResponseEntity<ApiResponse<BranchCashPositionDto>> getBranchPosition(@PathVariable Long branchId) {
        BranchCashPositionDto pos = branchCashService.getBranchCashPosition(branchId);
        return ResponseEntity.ok(ApiResponse.ok(pos));
    }

    @PostMapping("/drawers/open")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Open Teller Cash Drawer", description = "Allocates starting physical cash from branch vault to teller cash drawer")
    public ResponseEntity<ApiResponse<TellerCashDrawerDto>> openDrawer(
            @Valid @RequestBody OpenDrawerRequest request,
            @AuthenticationPrincipal User user) {
        TellerCashDrawerDto drawer = branchCashService.openTellerDrawer(request, user);
        return ResponseEntity.ok(ApiResponse.ok(drawer, "Teller cash drawer opened successfully"));
    }

    @GetMapping("/drawers/my-drawer")
    @PreAuthorize("hasAnyRole('CASHIER', 'SUPER_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Cashier Current Active Drawer")
    public ResponseEntity<ApiResponse<TellerCashDrawerDto>> getMyDrawer(@AuthenticationPrincipal User user) {
        TellerCashDrawerDto drawer = branchCashService.getCashierDrawer(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(drawer));
    }

    @GetMapping("/drawers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Branch Teller Drawers")
    public ResponseEntity<ApiResponse<List<TellerCashDrawerDto>>> getDrawersByBranch(@RequestParam Long branchId) {
        List<TellerCashDrawerDto> drawers = branchCashService.getDrawersByBranch(branchId);
        return ResponseEntity.ok(ApiResponse.ok(drawers));
    }

    @PostMapping("/drawers/handover")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'SUPER_ADMIN')")
    @Operation(summary = "Execute Teller Handover / Vault Return", description = "Verifies physical currency count against system expected balance and logs shortage/excess incidents")
    public ResponseEntity<ApiResponse<CashShortageExcessDto>> executeHandover(
            @Valid @RequestBody TellerHandoverRequest request,
            @AuthenticationPrincipal User user) {
        CashShortageExcessDto variance = branchCashService.executeTellerHandover(request, user);
        String msg = variance != null
                ? "Handover completed with physical cash variance flagged for audit investigation"
                : "Handover verified with zero physical cash variance. Vault/teller balances updated.";
        return ResponseEntity.ok(ApiResponse.ok(variance, msg));
    }

    @PostMapping("/transfers/initiate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Initiate Inter-Branch Cash Transit Dispatch", description = "Dispatches armored vehicle cash shipment between branch nodes and posts Due-From double-entry clearing voucher")
    public ResponseEntity<ApiResponse<InterBranchTransferDto>> initiateTransfer(
            @Valid @RequestBody InterBranchTransferRequest request,
            @AuthenticationPrincipal User user) {
        InterBranchTransferDto transfer = branchCashService.initiateInterBranchTransfer(request, user);
        return ResponseEntity.ok(ApiResponse.ok(transfer, "Inter-branch cash transit dispatched with Due-From clearing entry"));
    }

    @PostMapping("/transfers/{id}/receive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Receive & Settle Inter-Branch Cash Transit", description = "Confirms armored carrier delivery into branch vault and posts Due-To settlement voucher")
    public ResponseEntity<ApiResponse<InterBranchTransferDto>> receiveTransfer(
            @PathVariable Long id,
            @RequestParam(required = false) String receiptRemarks,
            @AuthenticationPrincipal User user) {
        InterBranchTransferDto transfer = branchCashService.receiveAndSettleInterBranchTransfer(id, receiptRemarks, user);
        return ResponseEntity.ok(ApiResponse.ok(transfer, "Cash transit received and settled into destination vault"));
    }

    @GetMapping("/transfers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Inter-Branch Cash Shipments")
    public ResponseEntity<ApiResponse<Page<InterBranchTransferDto>>> getTransfers(@PageableDefault(size = 20) Pageable pageable) {
        Page<InterBranchTransferDto> transfers = branchCashService.getInterBranchTransfers(pageable);
        return ResponseEntity.ok(ApiResponse.ok(transfers));
    }

    @GetMapping("/variances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Get Cash Shortage & Excess Audit Records")
    public ResponseEntity<ApiResponse<Page<CashShortageExcessDto>>> getVariances(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CashShortageExcessDto> variances = branchCashService.getVariances(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(variances));
    }

    @PostMapping("/variances/{id}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'AUDITOR')")
    @Operation(summary = "Resolve Cash Variance Record")
    public ResponseEntity<ApiResponse<CashShortageExcessDto>> resolveVariance(
            @PathVariable Long id,
            @Valid @RequestBody ResolveExceptionRequest request,
            @AuthenticationPrincipal User user) {
        CashShortageExcessDto resolved = branchCashService.resolveVariance(id, request.getResolutionNotes(), user);
        return ResponseEntity.ok(ApiResponse.ok(resolved, "Cash variance investigated and resolved"));
    }
}
