package com.apexbank.dto.branch;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchDto {
    private Long id;
    private String branchCode;
    private String name;
    private String ifscCode;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String phone;
    private String email;
    private String status;
    private Boolean isHeadOffice;
    private BigDecimal cashVaultBalance;
    private Long regionId;
    private String regionName;
    private Long branchManagerId;
    private String branchManagerName;
    private long employeeCount;
    private long activeAccounts;
    private BigDecimal totalDeposits;
    private BigDecimal totalAdvances;
}
