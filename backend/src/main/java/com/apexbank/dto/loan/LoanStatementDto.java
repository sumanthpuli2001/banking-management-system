package com.apexbank.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanStatementDto {
    private String loanAccountNumber;
    private String customerName;
    private String customerNumber;
    private String loanType;
    private BigDecimal sanctionedPrincipal;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal monthlyEmi;
    private BigDecimal outstandingPrincipal;
    private BigDecimal totalPrincipalRepaid;
    private BigDecimal totalInterestRepaid;
    private String assetClassification;
    private Integer daysPastDue;
    private BigDecimal requiredProvisionAmount;
    private List<LoanStatementEntryDto> entries;
}
