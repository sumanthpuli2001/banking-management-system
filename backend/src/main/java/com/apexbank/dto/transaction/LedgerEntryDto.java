package com.apexbank.dto.transaction;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntryDto {
    private Long id;
    private String transactionReference;
    private String accountNumber;
    private String entryType; // DEBIT / CREDIT
    private BigDecimal amount;
    private BigDecimal runningBalance;
    private LocalDateTime entryTimestamp;
}
