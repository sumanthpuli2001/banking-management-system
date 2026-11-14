package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.transaction.*;
import com.apexbank.entity.TransactionType;
import com.apexbank.entity.User;
import com.apexbank.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/transactions")
@Tag(name = "Transaction & Financial Operations", description = "Endpoints for counter deposits, withdrawals, fund transfers, and double-entry ledgers")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER')")
    @Operation(summary = "Process Cash Deposit", description = "Executes counter cash acceptance, updates vault balance, and posts double-entry credit ledger")
    public ResponseEntity<ApiResponse<TransactionDto>> deposit(
            @Valid @RequestBody CashDepositRequest request,
            @AuthenticationPrincipal User user) {
        TransactionDto txn = transactionService.processCashDeposit(request, user);
        return ResponseEntity.ok(ApiResponse.ok(txn, "Cash deposit processed successfully"));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER')")
    @Operation(summary = "Process Cash Withdrawal", description = "Validates account balance & cashier vault, executes counter withdrawal, and posts debit ledger")
    public ResponseEntity<ApiResponse<TransactionDto>> withdraw(
            @Valid @RequestBody CashWithdrawalRequest request,
            @AuthenticationPrincipal User user) {
        TransactionDto txn = transactionService.processCashWithdrawal(request, user);
        return ResponseEntity.ok(ApiResponse.ok(txn, "Cash withdrawal processed successfully"));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER')")
    @Operation(summary = "Initiate Fund Transfer", description = "Executes intra/interbank transfer with pessimistic row locks and balanced debit/credit ledgers. Requests > INR 5,00,000 are queued for Maker-Checker approval.")
    public ResponseEntity<ApiResponse<TransactionDto>> transfer(
            @Valid @RequestBody FundTransferRequest request,
            @AuthenticationPrincipal User user) {
        TransactionDto txn = transactionService.processFundTransfer(request, user);
        String msg = txn.getStatus().name().equals("PENDING_APPROVAL")
                ? "High-value transfer queued for Maker-Checker dual authorization"
                : "Fund transfer executed successfully";
        return ResponseEntity.ok(ApiResponse.ok(txn, msg));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'AUDITOR')")
    @Operation(summary = "Get Filtered Transactions", description = "Searches transactions by branch, type, status, and date range")
    public ResponseEntity<ApiResponse<Page<TransactionDto>>> getTransactions(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<TransactionDto> txns = transactionService.getTransactions(branchId, type, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.ok(txns));
    }

    @GetMapping("/ledger/{accountNumber}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Account Statement & Ledger", description = "Retrieves double-entry transaction ledger with running balances for account statement generation")
    public ResponseEntity<ApiResponse<Page<LedgerEntryDto>>> getAccountLedger(
            @PathVariable String accountNumber,
            @PageableDefault(size = 30) Pageable pageable) {
        Page<LedgerEntryDto> ledger = transactionService.getAccountLedger(accountNumber, pageable);
        return ResponseEntity.ok(ApiResponse.ok(ledger));
    }
}
