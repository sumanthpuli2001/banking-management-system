package com.apexbank.dto.accounting;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosingRequest {
    @NotNull(message = "Branch ID is mandatory")
    private Long branchId;

    @NotNull(message = "Closing date is mandatory")
    private LocalDate closingDate;

    @NotNull(message = "Physical cash counted is mandatory")
    private BigDecimal physicalCashCounted;

    private String notes;
}
