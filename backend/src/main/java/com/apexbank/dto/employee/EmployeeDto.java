package com.apexbank.dto.employee;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDto {
    private Long id;
    private String employeeCode;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String designation;
    private String department;
    private BigDecimal salary;
    private String status;
    private String role;
}
