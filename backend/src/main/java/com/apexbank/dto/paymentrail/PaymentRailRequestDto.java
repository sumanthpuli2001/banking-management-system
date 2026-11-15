package com.apexbank.dto.paymentrail;

import com.apexbank.entity.paymentrail.PaymentRailMode;
import com.apexbank.entity.paymentrail.PaymentRailType;
import com.apexbank.entity.paymentrail.SimulationOutcome;
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
public class PaymentRailRequestDto {

    @NotBlank(message = "Source account number is mandatory")
    private String sourceAccountNumber;

    @NotBlank(message = "Destination account number is mandatory")
    private String destinationAccountNumber;

    @NotBlank(message = "Beneficiary name is mandatory")
    private String beneficiaryName;

    private String beneficiaryIfsc;

    @NotNull(message = "Transfer amount is mandatory")
    @DecimalMin(value = "1.00", message = "Transfer amount must be at least INR 1.00")
    private BigDecimal amount;

    @NotNull(message = "Payment rail selection is mandatory (INTERNAL, NEFT, RTGS, IMPS)")
    private PaymentRailType railType;

    @Builder.Default
    private PaymentRailMode operatingMode = PaymentRailMode.SIMULATION;

    @Builder.Default
    private SimulationOutcome simulatedOutcome = SimulationOutcome.SUCCESS;

    private String narration;

    private String idempotencyKey;
}
