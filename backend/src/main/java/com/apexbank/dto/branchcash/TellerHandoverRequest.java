package com.apexbank.dto.branchcash;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TellerHandoverRequest {
    @NotNull(message = "Drawer ID is mandatory")
    private Long drawerId;

    private Long destinationTellerId;

    @NotNull(message = "isVaultReturn indicator is mandatory")
    private Boolean isVaultReturn;

    @NotNull(message = "Physical count amount is mandatory")
    @DecimalMin(value = "0.00", message = "Physical count cannot be negative")
    private BigDecimal physicalCountAmount;

    private String handoverRemarks;
}
