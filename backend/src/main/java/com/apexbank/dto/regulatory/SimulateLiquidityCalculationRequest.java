package com.apexbank.dto.regulatory;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulateLiquidityCalculationRequest {

    private LocalDate calculationDate;
    private BigDecimal customCrrRate;
    private BigDecimal customSlrRate;
    private BigDecimal stressScenarioDepositDrainPct; // e.g. 5% deposit outflow scenario
    private String simulationNotes;
}
