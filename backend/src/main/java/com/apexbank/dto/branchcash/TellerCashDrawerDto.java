package com.apexbank.dto.branchcash;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TellerCashDrawerDto {
    private Long id;
    private String drawerCode;
    private Long branchId;
    private String branchName;
    private Long cashierUserId;
    private String cashierUsername;
    private String cashierFullName;
    private String status;
    private BigDecimal openingBalance;
    private BigDecimal cashReceipts;
    private BigDecimal cashPayments;
    private BigDecimal currentBalance;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
}
