package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_repayments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LoanRepayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "emi_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal emiAmount;

    @Column(name = "principal_component", precision = 18, scale = 2)
    private BigDecimal principalComponent;

    @Column(name = "interest_component", precision = 18, scale = 2)
    private BigDecimal interestComponent;

    @Column(name = "due_date", columnDefinition = "DATETIME", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "paid_date", columnDefinition = "DATETIME")
    private LocalDateTime paidDate;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SCHEDULED"; // SCHEDULED, PAID, OVERDUE

    @Column(name = "penalty_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal penaltyAmount = BigDecimal.ZERO;
}
