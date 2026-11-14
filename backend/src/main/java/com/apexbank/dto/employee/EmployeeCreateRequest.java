package com.apexbank.dto.employee;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeCreateRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email
    private String email;

    private String phone;

    @NotBlank(message = "Designation is required")
    private String designation;

    private String department;

    @NotBlank(message = "Role is required (e.g. BRANCH_MANAGER, CASHIER, etc.)")
    private String role;

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    private BigDecimal salary;
}
