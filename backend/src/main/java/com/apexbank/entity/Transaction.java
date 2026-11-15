package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_txn_ref", columnList = "reference_number"),
    @Index(name = "idx_txn_idempotency", columnList = "idempotency_key"),
    @Index(name = "idx_txn_timestamp", columnList = "transaction_timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Transaction extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_number", nullable = false, unique = true, length = 64)
    private String referenceNumber; // TXN-20261114-XXXXXX

    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_account_id")
    private BankAccount sourceAccount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_account_id")
    private BankAccount destinationAccount;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "fee", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 40)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.INITIATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "accounting_posting_status", length = 30)
    @Builder.Default
    private AccountingPostingStatus accountingPostingStatus = AccountingPostingStatus.POSTED_BALANCED;

    @Enumerated(EnumType.STRING)
    @Column(name = "external_payment_status", length = 30)
    @Builder.Default
    private ExternalPaymentStatus externalPaymentStatus = ExternalPaymentStatus.INTERNAL;

    @Column(name = "payment_channel", length = 40)
    @Builder.Default
    private String paymentChannel = "BRANCH_COUNTER"; // BRANCH_COUNTER, INTERNET_BANKING, CLEARING_HOUSE

    @Column(name = "narration", length = 255)
    private String narration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_user_id")
    private User initiatedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "settled_at", columnDefinition = "DATETIME")
    private LocalDateTime settledAt;

    @Column(name = "reconciled_at", columnDefinition = "DATETIME")
    private LocalDateTime reconciledAt;

    @Column(name = "transaction_timestamp", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime transactionTimestamp = LocalDateTime.now();

    public void transitionTo(TransactionStatus newStatus) {
        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(String.format(
                "Invalid transaction lifecycle transition from %s to %s for reference %s",
                this.status, newStatus, this.referenceNumber
            ));
        }
        this.status = newStatus;
        if (newStatus == TransactionStatus.SETTLED || newStatus == TransactionStatus.SUCCESS) {
            this.settledAt = LocalDateTime.now();
        } else if (newStatus == TransactionStatus.RECONCILED) {
            this.reconciledAt = LocalDateTime.now();
        }
    }
}
