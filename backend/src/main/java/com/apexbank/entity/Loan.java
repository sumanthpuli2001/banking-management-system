package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Loan extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_account_number", nullable = false, unique = true, length = 40)
    private String loanAccountNumber; // LA-BLR-2026-XXXX

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id")
    private LoanApplication loanApplication;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "loan_type", nullable = false, length = 40)
    private String loanType;

    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate; // Annual %

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "monthly_emi", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyEmi;

    @Column(name = "total_interest", precision = 18, scale = 2)
    private BigDecimal totalInterest;

    @Column(name = "total_payable", precision = 18, scale = 2)
    private BigDecimal totalPayable;

    @Column(name = "outstanding_principal", nullable = false, precision = 18, scale = 2)
    private BigDecimal outstandingPrincipal;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // DISBURSED, ACTIVE, DEFAULTED, CLOSED

    @Column(name = "sanctioned_date", columnDefinition = "DATETIME")
    private LocalDateTime sanctionedDate;

    @Column(name = "maturity_date", columnDefinition = "DATETIME")
    private LocalDateTime maturityDate;

    @Column(name = "next_due_date", columnDefinition = "DATETIME")
    private LocalDateTime nextDueDate;
}
