package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LoanApplication extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_number", nullable = false, unique = true, length = 50)
    private String applicationNumber; // LN-APP-2026-XXXX

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "loan_type", nullable = false, length = 40)
    private String loanType; // PERSONAL, HOME, VEHICLE, EDUCATION, BUSINESS

    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "requested_tenure_months", nullable = false)
    private Integer requestedTenureMonths;

    @Column(name = "purpose", length = 255)
    private String purpose;

    @Column(name = "monthly_income", precision = 18, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(name = "credit_score")
    @Builder.Default
    private Integer creditScore = 750;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SUBMITTED"; // SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, DISBURSED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "application_date", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime applicationDate = LocalDateTime.now();
}
