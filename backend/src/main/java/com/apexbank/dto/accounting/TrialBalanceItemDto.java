package com.apexbank.dto.accounting;

import com.apexbank.entity.AccountClassification;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrialBalanceItemDto {
    private String accountCode;
    private String accountName;
    private AccountClassification classification;
    private BigDecimal debitBalance;
    private BigDecimal creditBalance;
}
