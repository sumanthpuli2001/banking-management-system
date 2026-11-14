package com.apexbank.dto.branch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchCreateRequest {

    @NotBlank(message = "Branch code is required")
    private String branchCode;

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "IFSC code is required")
    private String ifscCode;

    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String phone;
    private String email;

    @NotNull(message = "Region ID is required")
    private Long regionId;

    private BigDecimal initialVaultBalance;
}
