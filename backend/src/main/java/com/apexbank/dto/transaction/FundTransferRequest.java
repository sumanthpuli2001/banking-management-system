package com.apexbank.dto.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundTransferRequest {

    @NotBlank(message = "Source account number is required")
    private String sourceAccountNumber;

    @NotBlank(message = "Destination account number is required")
    private String destinationAccountNumber;

    @NotNull(message = "Transfer amount is required")
    @DecimalMin(value = "1.00", message = "Minimum transfer amount is INR 1.00")
    private BigDecimal amount;

    private String idempotencyKey;
    private String narration;

    @Builder.Default
    private String paymentChannel = "INTERNAL_TRANSFER"; // INTERNAL_TRANSFER, INTERBANK_NEFT, INTERBANK_RTGS
}
