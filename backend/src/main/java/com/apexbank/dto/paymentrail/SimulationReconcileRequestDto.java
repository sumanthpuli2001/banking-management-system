package com.apexbank.dto.paymentrail;

import com.apexbank.entity.paymentrail.PaymentRailStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SimulationReconcileRequestDto {

    @NotNull(message = "Target status is required (e.g., SETTLED, RECONCILED, FAILED)")
    private PaymentRailStatus targetStatus;

    private String reconciliationRemarks;
}
