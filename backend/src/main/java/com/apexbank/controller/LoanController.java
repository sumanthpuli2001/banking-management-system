package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.loan.LoanApplicationDto;
import com.apexbank.dto.loan.LoanApplicationRequest;
import com.apexbank.dto.loan.LoanDto;
import com.apexbank.dto.loan.LoanRepaymentDto;
import com.apexbank.entity.User;
import com.apexbank.service.LoanService;
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
@RequestMapping("/api/v1/loans")
@Tag(name = "Lending & Credit Operations", description = "Endpoints for loan origination, credit scoring, underwriting, and EMI amortization schedules")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @PostMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'LOAN_OFFICER', 'CUSTOMER')")
    @Operation(summary = "Submit Loan Application", description = "Applies for personal, home, auto, education, or business loan")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> submitApplication(@Valid @RequestBody LoanApplicationRequest request) {
        LoanApplicationDto app = loanService.submitApplication(request);
        return ResponseEntity.ok(ApiResponse.ok(app, "Loan application registered successfully"));
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR')")
    @Operation(summary = "Get Loan Applications", description = "Retrieves loan applications queue, filterable by branch and status")
    public ResponseEntity<ApiResponse<Page<LoanApplicationDto>>> getApplications(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LoanApplicationDto> apps = loanService.getApplications(branchId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(apps));
    }

    @PostMapping("/applications/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER')")
    @Operation(summary = "Sanction & Disburse Loan", description = "Underwrites loan application, generates EMI amortization schedule, and disburses funds to account")
    public ResponseEntity<ApiResponse<LoanDto>> approveLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        LoanDto loan = loanService.approveAndDisburseLoan(id, user);
        return ResponseEntity.ok(ApiResponse.ok(loan, "Loan sanctioned and disbursed successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Active Loans", description = "Retrieves active loan advances and outstanding balances")
    public ResponseEntity<ApiResponse<Page<LoanDto>>> getLoans(
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LoanDto> loans = loanService.getLoans(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(loans));
    }

    @GetMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get EMI Repayment Schedule", description = "Retrieves monthly installment schedule with principal and interest components")
    public ResponseEntity<ApiResponse<List<LoanRepaymentDto>>> getSchedule(@PathVariable Long id) {
        List<LoanRepaymentDto> schedule = loanService.getRepayments(id);
        return ResponseEntity.ok(ApiResponse.ok(schedule));
    }
}
