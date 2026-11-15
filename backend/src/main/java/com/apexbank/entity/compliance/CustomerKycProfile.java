package com.apexbank.entity.compliance;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_kyc_profiles", indexes = {
        @Index(name = "idx_kyc_cust_id", columnList = "customer_id", unique = true),
        @Index(name = "idx_kyc_due_date", columnList = "next_kyc_review_due_date"),
        @Index(name = "idx_kyc_edd_status", columnList = "edd_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomerKycProfile extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private Long customerId;

    @Column(name = "cdd_status", nullable = false, length = 30)
    @Builder.Default
    private String cddStatus = "SIMULATED_VERIFIED"; // SIMULATED_VERIFIED, PENDING_VERIFICATION, REJECTED, EXPIRED

    @Column(name = "pan_verification_status", length = 30)
    @Builder.Default
    private String panVerificationStatus = "SIMULATED_VERIFIED"; // SIMULATED_VERIFIED, PENDING, FAILED

    @Column(name = "pan_verification_source", length = 60)
    @Builder.Default
    private String panVerificationSource = "SIMULATED_NSDL_SANDBOX";

    @Column(name = "aadhaar_verification_status", length = 30)
    @Builder.Default
    private String aadhaarVerificationStatus = "SIMULATED_VERIFIED"; // SIMULATED_VERIFIED, PENDING, FAILED

    @Column(name = "aadhaar_verification_source", length = 60)
    @Builder.Default
    private String aadhaarVerificationSource = "SIMULATED_UIDAI_SANDBOX";

    @Column(name = "address_verification_status", length = 30)
    @Builder.Default
    private String addressVerificationStatus = "VERIFIED"; // VERIFIED, PENDING, DISCREPANCY

    @Column(name = "is_pep", nullable = false)
    @Builder.Default
    private Boolean isPep = false; // Politically Exposed Person

    @Column(name = "risk_category", nullable = false, length = 20)
    @Builder.Default
    private String riskCategory = "LOW"; // LOW, MEDIUM, HIGH, PEP

    @Column(name = "last_kyc_review_date")
    private LocalDate lastKycReviewDate;

    @Column(name = "next_kyc_review_due_date")
    private LocalDate nextKycReviewDueDate;

    @Column(name = "document_expiry_date")
    private LocalDate documentExpiryDate;

    @Column(name = "edd_status", nullable = false, length = 30)
    @Builder.Default
    private String eddStatus = "NOT_REQUIRED"; // NOT_REQUIRED, PENDING_REVIEW, APPROVED, REJECTED

    @Column(name = "edd_source_of_wealth", columnDefinition = "TEXT")
    private String eddSourceOfWealth;

    @Column(name = "edd_beneficial_ownership", columnDefinition = "TEXT")
    private String eddBeneficialOwnership;

    @Column(name = "edd_approved_by", length = 60)
    private String eddApprovedBy;

    @Column(name = "edd_approved_at")
    private LocalDateTime eddApprovedAt;

    @Column(name = "kyc_notes", columnDefinition = "TEXT")
    private String kycNotes;
}
