package com.apexbank.dto.paymentrail;

import com.apexbank.entity.paymentrail.PaymentRailMode;
import com.apexbank.entity.paymentrail.PaymentRailType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRailConfigDto {

    private PaymentRailType railType;
    private String name;
    private String description;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private BigDecimal flatFee;
    private PaymentRailMode operatingMode;
    private String batchCycle;
    private boolean isAvailable;
    private String warningNotice;
}
