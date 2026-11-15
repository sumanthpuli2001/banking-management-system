package com.apexbank.dto.branchcash;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterBranchTransferRequest {
    @NotNull(message = "Source Branch ID is mandatory")
    private Long sourceBranchId;

    @NotNull(message = "Destination Branch ID is mandatory")
    private Long destinationBranchId;

    @NotNull(message = "Transfer amount is mandatory")
    @DecimalMin(value = "1000.00", message = "Minimum inter-branch cash transfer is INR 1,000.00")
    private BigDecimal amount;

    private String transitCarrier;
    private String securitySealNumber;
    private String dispatchRemarks;
}
