package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BankAccount extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_number", nullable = false, unique = true, length = 30)
    private String accountNumber; // 16-digit account number

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 30)
    private AccountType accountType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "available_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, DORMANT, FROZEN, CLOSED

    @Column(name = "interest_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal interestRate = new BigDecimal("4.00");

    @Column(name = "daily_withdrawal_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal dailyWithdrawalLimit = new BigDecimal("100000.00");

    @Column(name = "daily_transfer_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal dailyTransferLimit = new BigDecimal("500000.00");

    @Column(name = "opened_date", columnDefinition = "DATETIME")
    private LocalDateTime openedDate;

    @Column(name = "closed_date", columnDefinition = "DATETIME")
    private LocalDateTime closedDate;

    @Column(name = "freeze_reason", length = 255)
    private String freezeReason;
}
