package com.apexbank.controller;

import com.apexbank.dto.common.ApiResponse;
import com.apexbank.dto.employee.EmployeeCreateRequest;
import com.apexbank.dto.employee.EmployeeDto;
import com.apexbank.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
@Tag(name = "Employee Management", description = "Endpoints for bank personnel directory, recruitment, and role provisioning")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Employee Directory", description = "Retrieves paginated employee directory, optionally scoped by branch")
    public ResponseEntity<ApiResponse<Page<EmployeeDto>>> getEmployees(
            @RequestParam(required = false) Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<EmployeeDto> employees = employeeService.getEmployees(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(employees));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER')")
    @Operation(summary = "Get Employee Profile", description = "Retrieves specific employee record")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable Long id) {
        EmployeeDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok(employee));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Register Employee", description = "Onboards new bank staff, creates institutional user credentials, and assigns role")
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        EmployeeDto employee = employeeService.createEmployee(request);
        return ResponseEntity.ok(ApiResponse.ok(employee, "Employee recruited and onboarded successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER')")
    @Operation(summary = "Update Employee Status", description = "Updates operational status (ACTIVE, ON_LEAVE, SUSPENDED, TERMINATED)")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        EmployeeDto employee = employeeService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(employee, "Employee status updated"));
    }
}
