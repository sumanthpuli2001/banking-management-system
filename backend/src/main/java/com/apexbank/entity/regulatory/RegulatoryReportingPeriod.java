package com.apexbank.entity.regulatory;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "regulatory_reporting_periods", indexes = {
        @Index(name = "idx_rrp_period_name", columnList = "period_name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulatoryReportingPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_name", nullable = false, unique = true, length = 50)
    private String periodName; // e.g., RRF-2026-NOV-F1

    @Column(name = "fortnight_number", nullable = false)
    private Integer fortnightNumber;

    @Column(name = "reporting_start_date", nullable = false)
    private LocalDate reportingStartDate;

    @Column(name = "reporting_end_date", nullable = false)
    private LocalDate reportingEndDate;

    @Column(name = "submission_deadline", nullable = false)
    private LocalDate submissionDeadline;

    @Column(name = "reporting_status", nullable = false, length = 30)
    @Builder.Default
    private String reportingStatus = "ACTIVE_ACCUMULATING"; // ACTIVE_ACCUMULATING, SIMULATED_REPORTED, AUDITED_FILED

    @Column(name = "ndtl_basis_amount", precision = 18, scale = 4)
    private BigDecimal ndtlBasisAmount;

    @Column(name = "form_a_submitted_at")
    private LocalDateTime formASubmittedAt;

    @Column(name = "submitted_by", length = 60)
    private String submittedBy;
}
