package com.apexbank.dto.customer;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerDto {
    private Long id;
    private String customerNumber;
    private Long userId;
    private String fullName;
    private String dateOfBirth;
    private String gender;
    private String panNumber;
    private String aadhaarNumber;
    private String email;
    private String phone;
    private String addressLine1;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String kycStatus;
    private String riskCategory;
    private String occupation;
    private BigDecimal annualIncome;
    private String status;
    private Long primaryBranchId;
    private String primaryBranchCode;
    private String primaryBranchName;
    private long accountCount;
    private BigDecimal totalBalance;
}
