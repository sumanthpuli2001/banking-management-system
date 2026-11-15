package com.apexbank.dto.regulatory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRegulatoryConfigRequest {

    @NotBlank(message = "Parameter key is required")
    private String parameterKey;

    @NotNull(message = "Parameter value is required")
    @DecimalMin(value = "0.00", message = "Rate cannot be negative")
    private BigDecimal parameterValue;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    private String sourceCircularReference;
    private String description;
}
