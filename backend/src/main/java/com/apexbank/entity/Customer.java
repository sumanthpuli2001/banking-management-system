package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Customer extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_number", nullable = false, unique = true, length = 30)
    private String customerNumber; // e.g. CIF-100234

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "primary_branch_id")
    private Branch primaryBranch;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "date_of_birth", length = 30)
    private String dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "pan_number", length = 30)
    private String panNumber; // Masked representation: ABCDE****F

    @Column(name = "aadhaar_number", length = 30)
    private String aadhaarNumber; // Masked: ********1234

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 80)
    private String city;

    @Column(name = "state", length = 80)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", length = 50)
    @Builder.Default
    private String country = "India";

    @Column(name = "kyc_status", nullable = false, length = 30)
    @Builder.Default
    private String kycStatus = "VERIFIED"; // PENDING, VERIFIED, REJECTED, SUSPENDED

    @Column(name = "kyc_verified_at", columnDefinition = "DATETIME")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "risk_category", nullable = false, length = 30)
    @Builder.Default
    private String riskCategory = "LOW"; // LOW, MEDIUM, HIGH, PEP

    @Column(name = "occupation", length = 80)
    private String occupation;

    @Column(name = "annual_income", precision = 18, scale = 2)
    private BigDecimal annualIncome;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, FROZEN
}
