package com.apexbank.dto.accounting;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntryDto {
    private Long id;
    private String entryNumber;
    private LocalDate postingDate;
    private String transactionReference;
    private String transactionType;
    private Long branchId;
    private String branchName;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private String status;
    private String narration;
    private String createdByUsername;
    private Long reversedByEntryId;
    private String reversalReason;
    private LocalDateTime postedAt;
    private List<JournalEntryLineDto> lines;
}
