package com.apexbank.dto.regulatory;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibleLiquidAssetDto {

    private Long id;
    private String assetIdentifier;
    private String assetName;
    private String assetType;
    private BigDecimal faceValue;
    private BigDecimal bookValue;
    private BigDecimal marketValue;
    private BigDecimal couponRate;
    private LocalDate maturityDate;
    private Boolean isEncumbered;
    private String custodyDepository;
    private LocalDate valuationDate;
}
