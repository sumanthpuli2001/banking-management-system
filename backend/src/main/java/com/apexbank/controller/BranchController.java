package com.apexbank.controller;

import com.apexbank.dto.branch.BranchCreateRequest;
import com.apexbank.dto.branch.BranchDto;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@Tag(name = "Branch Management", description = "Endpoints for nationwide branch operations, directory, and status control")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    @Operation(summary = "Get All Branches", description = "Retrieves nationwide branch directory, optionally filtered by regional zone")
    public ResponseEntity<ApiResponse<List<BranchDto>>> getAllBranches(@RequestParam(required = false) Long regionId) {
        List<BranchDto> branches = branchService.getAllBranches(regionId);
        return ResponseEntity.ok(ApiResponse.ok(branches));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Branch Details", description = "Retrieves specific branch profile, IFSC, and vault liquidity")
    public ResponseEntity<ApiResponse<BranchDto>> getBranchById(@PathVariable Long id) {
        BranchDto branch = branchService.getBranchById(id);
        return ResponseEntity.ok(ApiResponse.ok(branch));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Create New Branch", description = "Registers a new branch in the banking network")
    public ResponseEntity<ApiResponse<BranchDto>> createBranch(@Valid @RequestBody BranchCreateRequest request) {
        BranchDto branch = branchService.createBranch(request);
        return ResponseEntity.ok(ApiResponse.ok(branch, "Branch created successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN')")
    @Operation(summary = "Update Branch Status", description = "Activates or deactivates a branch")
    public ResponseEntity<ApiResponse<BranchDto>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        BranchDto branch = branchService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(branch, "Branch status updated"));
    }
}
