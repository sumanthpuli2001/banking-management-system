package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.loan.*;
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
@Tag(name = "Lending, Origination & NPA Management", description = "Endpoints for loan products, underwriting, sanction letters, EMI amortization, repayments, statements, and NPA provisioning")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping("/products")
    @Operation(summary = "Get Active Loan Products", description = "Retrieves catalogue of configurable retail, commercial, and priority sector loan products")
    public ResponseEntity<ApiResponse<List<LoanProductDto>>> getProducts() {
        List<LoanProductDto> products = loanService.getActiveLoanProducts();
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @PostMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'LOAN_OFFICER', 'CUSTOMER')")
    @Operation(summary = "Submit Loan Application", description = "Applies for loan with automatic underwriting, FOIR calculation, and credit risk grading")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> submitApplication(@Valid @RequestBody LoanApplicationRequest request) {
        LoanApplicationDto app = loanService.submitApplication(request);
        return ResponseEntity.ok(ApiResponse.ok(app, "Loan application registered and underwritten successfully"));
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
    @Operation(summary = "Sanction & Disburse Loan", description = "Issues sanction letter, computes pure BigDecimal amortization schedule, and disburses funds via double-entry accounting")
    public ResponseEntity<ApiResponse<LoanDto>> approveLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        LoanDto loan = loanService.approveAndDisburseLoan(id, user);
        return ResponseEntity.ok(ApiResponse.ok(loan, "Loan sanctioned, amortized, and disbursed successfully"));
    }

    @GetMapping("/applications/{id}/sanction")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CUSTOMER')")
    @Operation(summary = "Get Loan Sanction Letter", description = "Retrieves formal sanction letter including approved terms, rates, conditions, and expiry date")
    public ResponseEntity<ApiResponse<LoanSanctionLetterDto>> getSanctionLetter(@PathVariable Long id) {
        LoanSanctionLetterDto letter = loanService.getSanctionLetterByApplicationId(id)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(letter));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Loans", description = "Retrieves loan facilities with asset classification (Standard, SMA-0, SMA-1, SMA-2, NPA) and status filters")
    public ResponseEntity<ApiResponse<Page<LoanDto>>> getLoans(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String classification,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LoanDto> loans = loanService.getLoans(branchId, status, classification, pageable);
        return ResponseEntity.ok(ApiResponse.ok(loans));
    }

    @GetMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get EMI Repayment Schedule", description = "Retrieves monthly installment schedule with exact principal and interest split")
    public ResponseEntity<ApiResponse<List<LoanRepaymentDto>>> getSchedule(@PathVariable Long id) {
        List<LoanRepaymentDto> schedule = loanService.getRepayments(id);
        return ResponseEntity.ok(ApiResponse.ok(schedule));
    }

    @PostMapping("/repayments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'CASHIER', 'LOAN_OFFICER', 'CUSTOMER')")
    @Operation(summary = "Process Loan Repayment", description = "Applies payment towards overdue penalty, interest, and principal with double-entry general ledger posting")
    public ResponseEntity<ApiResponse<LoanDto>> processRepayment(
            @Valid @RequestBody RepaymentRequest request,
            @AuthenticationPrincipal User user) {
        LoanDto updated = loanService.processRepayment(request, user);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Loan repayment processed and credited to ledger"));
    }

    @GetMapping("/{id}/statement")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Loan Account Statement", description = "Generates comprehensive statement showing disbursement, repayments, running principal balance, and asset classification")
    public ResponseEntity<ApiResponse<LoanStatementDto>> getLoanStatement(@PathVariable Long id) {
        LoanStatementDto statement = loanService.getLoanStatement(id);
        return ResponseEntity.ok(ApiResponse.ok(statement));
    }

    @GetMapping("/npa/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get NPA Portfolio Classification Summary", description = "Consolidated credit health matrix covering Standard, SMA-0, SMA-1, SMA-2, Substandard, Doubtful, Loss assets, and required provisioning")
    public ResponseEntity<ApiResponse<NpaPortfolioSummaryDto>> getNpaSummary() {
        NpaPortfolioSummaryDto summary = loanService.getNpaPortfolioSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
