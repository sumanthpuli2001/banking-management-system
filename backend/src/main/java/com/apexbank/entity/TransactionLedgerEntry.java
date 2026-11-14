package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_ledger_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransactionLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", nullable = false)
    private BankAccount account;

    @Column(name = "entry_type", nullable = false, length = 10)
    private String entryType; // DEBIT or CREDIT

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "running_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal runningBalance;

    @Column(name = "entry_timestamp", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime entryTimestamp = LocalDateTime.now();
}
