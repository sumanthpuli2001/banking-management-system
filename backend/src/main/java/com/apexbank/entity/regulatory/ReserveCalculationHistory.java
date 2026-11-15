package com.apexbank.entity.regulatory;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reserve_calculation_histories", indexes = {
        @Index(name = "idx_rch_calc_date", columnList = "calculation_date"),
        @Index(name = "idx_rch_fortnight", columnList = "reporting_fortnight")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReserveCalculationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporting_fortnight", nullable = false, length = 30)
    private String reportingFortnight; // e.g., FN-2026-23

    @Column(name = "calculation_date", nullable = false)
    private LocalDate calculationDate;

    // NDTL Breakdown components
    @Column(name = "demand_liabilities", precision = 18, scale = 4, nullable = false)
    private BigDecimal demandLiabilities;

    @Column(name = "time_liabilities", precision = 18, scale = 4, nullable = false)
    private BigDecimal timeLiabilities;

    @Column(name = "other_demand_time_liabilities", precision = 18, scale = 4, nullable = false)
    private BigDecimal otherDemandTimeLiabilities;

    @Column(name = "interbank_exemptions", precision = 18, scale = 4, nullable = false)
    private BigDecimal interbankExemptions;

    @Column(name = "net_demand_time_liabilities", precision = 18, scale = 4, nullable = false)
    private BigDecimal netDemandTimeLiabilities; // NDTL

    // CRR Metrics
    @Column(name = "crr_rate_applied", precision = 6, scale = 4, nullable = false)
    private BigDecimal crrRateApplied;

    @Column(name = "crr_required_amount", precision = 18, scale = 4, nullable = false)
    private BigDecimal crrRequiredAmount;

    @Column(name = "crr_actual_maintained", precision = 18, scale = 4, nullable = false)
    private BigDecimal crrActualMaintained;

    @Column(name = "crr_surplus_deficit", precision = 18, scale = 4, nullable = false)
    private BigDecimal crrSurplusDeficit;

    @Column(name = "crr_compliance_status", nullable = false, length = 30)
    private String crrComplianceStatus; // COMPLIANT, DEFICIT, MARGINAL_SURPLUS

    // SLR Metrics
    @Column(name = "slr_rate_applied", precision = 6, scale = 4, nullable = false)
    private BigDecimal slrRateApplied;

    @Column(name = "slr_required_amount", precision = 18, scale = 4, nullable = false)
    private BigDecimal slrRequiredAmount;

    @Column(name = "slr_actual_maintained", precision = 18, scale = 4, nullable = false)
    private BigDecimal slrActualMaintained;

    @Column(name = "slr_surplus_deficit", precision = 18, scale = 4, nullable = false)
    private BigDecimal slrSurplusDeficit;

    @Column(name = "slr_compliance_status", nullable = false, length = 30)
    private String slrComplianceStatus; // COMPLIANT, DEFICIT, MARGINAL_SURPLUS

    // Classification & Verification
    @Column(name = "calculation_classification", nullable = false, length = 40)
    @Builder.Default
    private String calculationClassification = "SIMULATED_REGULATORY"; // INTERNAL_ESTIMATE, SIMULATED_REGULATORY, AUDITED_STATUTORY

    @Column(name = "is_regulatory_verified", nullable = false)
    @Builder.Default
    private Boolean isRegulatoryVerified = Boolean.FALSE;

    @Column(name = "verified_by", length = 60)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "calculation_details_json", columnDefinition = "TEXT")
    private String calculationDetailsJson;

    @Column(name = "calculated_by", length = 60)
    private String calculatedBy;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
