package com.apexbank.dto.branchcash;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OpenDrawerRequest {
    @NotNull(message = "Branch ID is mandatory")
    private Long branchId;

    @NotNull(message = "Cashier User ID is mandatory")
    private Long cashierUserId;

    @NotBlank(message = "Drawer code is mandatory")
    private String drawerCode;

    @NotNull(message = "Initial vault cash amount is mandatory")
    @DecimalMin(value = "0.00", message = "Initial cash amount cannot be negative")
    private BigDecimal initialVaultCashAmount;
}
