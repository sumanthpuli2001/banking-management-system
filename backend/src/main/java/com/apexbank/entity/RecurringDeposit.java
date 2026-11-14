package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_deposits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecurringDeposit extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", nullable = false)
    private BankAccount account;

    @Column(name = "monthly_installment", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyInstallment;

    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "maturity_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal maturityAmount;

    @Column(name = "next_installment_date", columnDefinition = "DATETIME")
    private LocalDateTime nextInstallmentDate;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, MATURED, CLOSED
}
