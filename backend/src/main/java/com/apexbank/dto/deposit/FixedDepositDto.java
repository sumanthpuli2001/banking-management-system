package com.apexbank.dto.deposit;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedDepositDto {
    private Long id;
    private String certificateNumber;
    private Long customerId;
    private String customerName;
    private String sourceAccountNumber;
    private Long branchId;
    private String branchName;
    private BigDecimal depositAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal maturityAmount;
    private LocalDateTime depositDate;
    private LocalDateTime maturityDate;
    private boolean autoRenew;
    private String status;
}
