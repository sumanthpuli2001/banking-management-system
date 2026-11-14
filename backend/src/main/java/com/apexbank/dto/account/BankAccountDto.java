package com.apexbank.dto.account;

import com.apexbank.entity.AccountType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountDto {
    private Long id;
    private String accountNumber;
    private AccountType accountType;
    private Long customerId;
    private String customerName;
    private String customerNumber;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private String currency;
    private String status;
    private BigDecimal interestRate;
    private BigDecimal dailyWithdrawalLimit;
    private BigDecimal dailyTransferLimit;
    private LocalDateTime openedDate;
    private String freezeReason;
}
