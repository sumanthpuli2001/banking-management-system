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
    private String depositType;
    private String productCode;
    private BigDecimal depositAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private String compoundingFrequency;
    private Boolean isSeniorCitizen;
    private BigDecimal seniorCitizenBonusRate;
    private BigDecimal maturityAmount;
    private BigDecimal totalInterestPayable;
    private BigDecimal accruedInterest;
    private BigDecimal taxDeductedAtSource;
    private Boolean tdsExemptionForm15G;
    private LocalDateTime depositDate;
    private LocalDateTime maturityDate;
    private boolean autoRenew;
    private String nomineeName;
    private String nomineeRelation;
    private String payoutAccountNumber;
    private String status;
    private LocalDateTime closedAt;
    private BigDecimal payoutAmount;
    private BigDecimal penaltyDeducted;
}
