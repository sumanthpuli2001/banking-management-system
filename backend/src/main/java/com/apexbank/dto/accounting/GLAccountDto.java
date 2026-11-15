package com.apexbank.dto.accounting;

import com.apexbank.entity.AccountClassification;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GLAccountDto {
    private Long id;
    private String accountCode;
    private String accountName;
    private AccountClassification classification;
    private String normalBalance;
    private Long branchId;
    private String branchName;
    private BigDecimal currentBalance;
    private String currency;
    private Boolean isActive;
    private String description;
}
