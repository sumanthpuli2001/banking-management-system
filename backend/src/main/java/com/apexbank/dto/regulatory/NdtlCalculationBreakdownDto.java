package com.apexbank.dto.regulatory;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NdtlCalculationBreakdownDto {

    private LocalDate calculationDate;
    private String reportingFortnight;

    // Demand Liabilities
    private BigDecimal savingsAccountDeposits;
    private BigDecimal currentAccountDeposits;
    private BigDecimal overdueDepositsAndMargins;
    private BigDecimal totalDemandLiabilities;

    // Time Liabilities
    private BigDecimal fixedDepositLiabilities;
    private BigDecimal recurringDepositLiabilities;
    private BigDecimal totalTimeLiabilities;

    // Other Demand and Time Liabilities (ODTL)
    private BigDecimal otherDemandTimeLiabilities;
    private BigDecimal grossDemandTimeLiabilities; // Total Demand + Total Time + ODTL

    // Inter-bank assets & exemptions
    private BigDecimal interbankAssetsBalances;
    private BigDecimal netInterBranchClearing;
    private BigDecimal totalExemptions;

    // Net Demand and Time Liabilities
    private BigDecimal netDemandTimeLiabilities; // NDTL

    private List<String> regulatoryFormulasApplied;
    private String centralBankCircularReference;
}
