package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.customer.CustomerCreateRequest;
import com.apexbank.dto.customer.CustomerDto;
import com.apexbank.entity.User;
import com.apexbank.service.CustomerService;
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
@RequestMapping("/api/v1/customers")
@Tag(name = "Customer Management & KYC", description = "Endpoints for customer onboarding, KYC documentation, and profile oversight")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'LOAN_OFFICER', 'AUDITOR')")
    @Operation(summary = "Get Customer Directory", description = "Retrieves paginated customer list, searchable by name, CIF, email, or phone")
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> getCustomers(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CustomerDto> customers = customerService.getCustomers(branchId, query, pageable);
        return ResponseEntity.ok(ApiResponse.ok(customers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'LOAN_OFFICER', 'AUDITOR', 'CUSTOMER')")
    @Operation(summary = "Get Customer Details", description = "Retrieves customer KYC dossier, accounts, and contact information")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        CustomerDto customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get Authenticated Customer Profile", description = "Retrieves profile for the logged in customer user")
    public ResponseEntity<ApiResponse<CustomerDto>> getMyCustomerProfile(@AuthenticationPrincipal User user) {
        CustomerDto customer = customerService.getCustomerByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(customer));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE')")
    @Operation(summary = "Onboard Customer", description = "Registers new customer with masked PAN/Aadhaar and generates CIF number")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerDto customer = customerService.createCustomer(request);
        return ResponseEntity.ok(ApiResponse.ok(customer, "Customer onboarded successfully"));
    }

    @PatchMapping("/{id}/kyc")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Update KYC Status", description = "Verifies or updates KYC verification status (VERIFIED, REJECTED, SUSPENDED)")
    public ResponseEntity<ApiResponse<CustomerDto>> updateKycStatus(@PathVariable Long id, @RequestParam String status) {
        CustomerDto customer = customerService.updateKycStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(customer, "KYC status updated"));
    }
}
