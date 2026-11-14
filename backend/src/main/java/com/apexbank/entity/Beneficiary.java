package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Beneficiary extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "beneficiary_name", nullable = false, length = 120)
    private String beneficiaryName;

    @Column(name = "account_number", nullable = false, length = 40)
    private String accountNumber;

    @Column(name = "ifsc_code", nullable = false, length = 20)
    private String ifscCode;

    @Column(name = "bank_name", length = 100)
    @Builder.Default
    private String bankName = "Apex National Bank";

    @Column(name = "branch_name", length = 100)
    private String branchName;

    @Column(name = "transfer_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal transferLimit = new BigDecimal("100000.00");

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // PENDING_APPROVAL, ACTIVE, INACTIVE

    @Column(name = "cooling_period_ends_at", columnDefinition = "DATETIME")
    private LocalDateTime coolingPeriodEndsAt;
}
