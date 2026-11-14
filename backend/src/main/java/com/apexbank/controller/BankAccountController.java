package com.apexbank.controller;

import com.apexbank.dto.account.AccountCreateRequest;
import com.apexbank.dto.account.AccountStatusUpdateRequest;
import com.apexbank.dto.account.BankAccountDto;
import com.apexbank.dto.common.ApiResponse;
import com.apexbank.entity.User;
import com.apexbank.service.BankAccountService;
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
@RequestMapping("/api/v1/accounts")
@Tag(name = "Bank Account Ledger", description = "Endpoints for savings, current, and deposit accounts lifecycle management")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'AUDITOR')")
    @Operation(summary = "Get All Bank Accounts", description = "Retrieves paginated accounts list, filterable by branch and status")
    public ResponseEntity<ApiResponse<Page<BankAccountDto>>> getAccounts(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<BankAccountDto> accounts = bankAccountService.getAccounts(branchId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Account by ID", description = "Retrieves full account balance and status details")
    public ResponseEntity<ApiResponse<BankAccountDto>> getAccountById(@PathVariable Long id) {
        BankAccountDto account = bankAccountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @GetMapping("/number/{accountNumber}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Account by Account Number", description = "Looks up account by 16-digit account number")
    public ResponseEntity<ApiResponse<BankAccountDto>> getAccountByNumber(@PathVariable String accountNumber) {
        BankAccountDto account = bankAccountService.getAccountByNumber(accountNumber);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Customer Accounts", description = "Retrieves all accounts owned by a specific customer")
    public ResponseEntity<ApiResponse<List<BankAccountDto>>> getAccountsByCustomer(@PathVariable Long customerId) {
        List<BankAccountDto> accounts = bankAccountService.getAccountsByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE')")
    @Operation(summary = "Open New Bank Account", description = "Creates a new savings, current, or salary account with initial deposit")
    public ResponseEntity<ApiResponse<BankAccountDto>> createAccount(
            @Valid @RequestBody AccountCreateRequest request,
            @AuthenticationPrincipal User user) {
        BankAccountDto account = bankAccountService.createAccount(request, user);
        return ResponseEntity.ok(ApiResponse.ok(account, "Bank account opened successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Update Account Status (Freeze/Unfreeze/Close)", description = "Alters account operational status with maker-checker audit record")
    public ResponseEntity<ApiResponse<BankAccountDto>> updateAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody AccountStatusUpdateRequest request,
            @AuthenticationPrincipal User user) {
        BankAccountDto account = bankAccountService.updateAccountStatus(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok(account, "Account status updated successfully"));
    }
}
