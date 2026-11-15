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
public class TrialBalanceDto {
    private LocalDate asOfDate;
    private Long branchId;
    private String branchName;
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private BigDecimal difference;
    private Boolean isBalanced;
    private LocalDateTime generatedAt;
    private List<TrialBalanceItemDto> items;
}
