package com.apexbank.dto.deposit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositCertificateDto {
    private String certificateNumber;
    private String depositType;
    private String productCode;
    private String productName;
    private Long customerId;
    private String customerName;
    private String customerNumber;
    private String sourceAccountNumber;
    private String payoutAccountNumber;
    private String branchCode;
    private String branchName;
    private BigDecimal depositPrincipal;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private String compoundingFrequency;
    private BigDecimal projectedMaturityAmount;
    private BigDecimal totalInterestEarned;
    private LocalDateTime depositDate;
    private LocalDateTime maturityDate;
    private Boolean autoRenew;
    private String nomineeName;
    private String nomineeRelation;
    private Boolean isSeniorCitizen;
    private Boolean tdsExemptionForm15G;
    private String status;
    private String authorizedSignatory;
}
