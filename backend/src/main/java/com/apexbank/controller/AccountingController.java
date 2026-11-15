package com.apexbank.controller;

import com.apexbank.dto.accounting.*;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.entity.AccountClassification;
import com.apexbank.entity.User;
import com.apexbank.service.AccountingEngineService;
import com.apexbank.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounting")
@Tag(name = "Double-Entry Accounting & General Ledger", description = "Endpoints for Chart of Accounts, General Ledger, Trial Balance, Journal Vouchers, and Daily EOD Closing")
public class AccountingController {

    private final AccountingEngineService accountingEngineService;
    private final AuthService authService;

    public AccountingController(AccountingEngineService accountingEngineService,
                                AuthService authService) {
        this.accountingEngineService = accountingEngineService;
        this.authService = authService;
    }

    @GetMapping("/chart-of-accounts")
    @Operation(summary = "Get Institutional Chart of Accounts (COA)", description = "Retrieves all standard GL accounts categorized by Assets, Liabilities, Equity, Revenue, and Expense")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<List<GLAccountDto>>> getChartOfAccounts(
            @RequestParam(required = false) AccountClassification classification) {
        List<GLAccountDto> coa = accountingEngineService.getChartOfAccounts(classification);
        return ResponseEntity.ok(ApiResponse.ok(coa));
    }

    @GetMapping("/trial-balance")
    @Operation(summary = "Generate Balanced Trial Balance", description = "Aggregates all GL debit and credit balances and validates accounting balance integrity")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<TrialBalanceDto>> getTrialBalance(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        TrialBalanceDto trialBalance = accountingEngineService.generateTrialBalance(branchId, asOfDate);
        return ResponseEntity.ok(ApiResponse.ok(trialBalance));
    }

    @GetMapping("/journal-entries")
    @Operation(summary = "Query General Ledger Journal Entries", description = "Paged query for double-entry journal vouchers with debit/credit breakdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<JournalEntryDto>>> getJournalEntries(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<JournalEntryDto> entries = accountingEngineService.getJournalEntries(branchId, startDate, endDate, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/journal-entries/{id}")
    @Operation(summary = "Get Journal Entry Details", description = "Fetches a specific journal voucher with its debit and credit line items")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'AUDITOR')")
    public ResponseEntity<ApiResponse<JournalEntryDto>> getJournalEntryById(@PathVariable Long id) {
        JournalEntryDto entry = accountingEngineService.getJournalEntryById(id);
        return ResponseEntity.ok(ApiResponse.ok(entry));
    }

    @PostMapping("/journal-entries/{id}/reverse")
    @Operation(summary = "Reverse a Posted Journal Entry", description = "Executes an immutable mirror reversal voucher. Never deletes the original record.")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<JournalEntryDto>> reverseJournalEntry(
            @PathVariable Long id,
            @Valid @RequestBody JournalReversalRequest request,
            Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        JournalEntryDto reversal = accountingEngineService.reverseJournalEntry(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok(reversal, "Journal entry reversed successfully with mirror voucher: " + reversal.getEntryNumber()));
    }

    @PostMapping("/daily-closing")
    @Operation(summary = "Perform Branch & Teller Daily Cash Closing", description = "Verifies cash receipts, payments, expected vault balance, and logs physical discrepancies")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DailyClosingDto>> performDailyClosing(
            @Valid @RequestBody DailyClosingRequest request,
            Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        DailyClosingDto closing = accountingEngineService.performDailyClosing(request, user, user);
        return ResponseEntity.ok(ApiResponse.ok(closing, "Daily cash closing recorded with status: " + closing.getStatus()));
    }

    @GetMapping("/daily-closing")
    @Operation(summary = "Get Daily Cash Closing Records", description = "History of branch end-of-day cash reconciliation audits")
    @PreAuthorize("hasAnyRole('CASHIER', 'BRANCH_MANAGER', 'HEAD_OFFICE_ADMIN', 'SUPER_ADMIN', 'AUDITOR')")
    public ResponseEntity<ApiResponse<Page<DailyClosingDto>>> getDailyClosings(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DailyClosingDto> closings = accountingEngineService.getDailyClosings(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(closings));
    }
}
