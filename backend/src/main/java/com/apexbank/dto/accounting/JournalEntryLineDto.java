package com.apexbank.dto.accounting;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntryLineDto {
    private Long id;
    private String glAccountCode;
    private String glAccountName;
    private String glAccountClassification;
    private String entryType; // "DEBIT" or "CREDIT"
    private BigDecimal amount;
    private String memo;
    private Integer lineNumber;
}
