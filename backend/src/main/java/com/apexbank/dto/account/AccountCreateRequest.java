package com.apexbank.dto.account;

import com.apexbank.entity.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    private BigDecimal initialDeposit;
}
