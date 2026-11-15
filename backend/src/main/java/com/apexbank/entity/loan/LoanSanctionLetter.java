package com.apexbank.entity.loan;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_sanction_letters", indexes = {
        @Index(name = "idx_sanction_letter_num", columnList = "sanction_reference", unique = true),
        @Index(name = "idx_sanction_app_id", columnList = "loan_application_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LoanSanctionLetter extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sanction_reference", nullable = false, unique = true, length = 60)
    private String sanctionReference; // SANCTION-2026-XXXX

    @Column(name = "loan_application_id", nullable = false)
    private Long loanApplicationId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Column(name = "sanctioned_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal sanctionedAmount;

    @Column(name = "approved_interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal approvedInterestRate;

    @Column(name = "approved_tenure_months", nullable = false)
    private Integer approvedTenureMonths;

    @Column(name = "monthly_emi", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyEmi;

    @Column(name = "processing_fee_amount", precision = 18, scale = 2)
    private BigDecimal processingFeeAmount;

    @Column(name = "sanction_date", nullable = false)
    private LocalDate sanctionDate;

    @Column(name = "validity_expiry_date", nullable = false)
    private LocalDate validityExpiryDate;

    @Column(name = "approving_authority_level", length = 60)
    private String approvingAuthorityLevel;

    @Column(name = "sanctioning_officer_username", length = 60)
    private String sanctioningOfficerUsername;

    @Column(name = "special_conditions", columnDefinition = "TEXT")
    private String specialConditions;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SANCTIONED"; // SANCTIONED, ACCEPTED, DISBURSED, EXPIRED
}
