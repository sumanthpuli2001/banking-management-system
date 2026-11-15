package com.apexbank.entity.paymentrail;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transaction_records", indexes = {
        @Index(name = "idx_pay_reference", columnList = "payment_reference", unique = true),
        @Index(name = "idx_pay_utr", columnList = "utr_number"),
        @Index(name = "idx_pay_rrn", columnList = "rrn_number"),
        @Index(name = "idx_pay_idempotency", columnList = "idempotency_key"),
        @Index(name = "idx_pay_rail_status", columnList = "rail_type, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PaymentTransactionRecord extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 64)
    private String paymentReference;

    @Column(name = "utr_number", length = 32)
    private String utrNumber;

    @Column(name = "rrn_number", length = 20)
    private String rrnNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "rail_type", nullable = false, length = 20)
    private PaymentRailType railType;

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_mode", nullable = false, length = 20)
    @Builder.Default
    private PaymentRailMode operatingMode = PaymentRailMode.SIMULATION;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PaymentRailStatus status;

    @Column(name = "source_account_number", nullable = false, length = 40)
    private String sourceAccountNumber;

    @Column(name = "destination_account_number", nullable = false, length = 40)
    private String destinationAccountNumber;

    @Column(name = "beneficiary_name", nullable = false, length = 120)
    private String beneficiaryName;

    @Column(name = "beneficiary_ifsc", length = 20)
    private String beneficiaryIfsc;

    @Column(name = "amount", precision = 18, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "fee", precision = 18, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "total_debited", precision = 18, scale = 4, nullable = false)
    private BigDecimal totalDebited;

    @Column(name = "narration", length = 255)
    private String narration;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "response_code", length = 30)
    private String responseCode;

    @Column(name = "response_message", length = 255)
    private String responseMessage;

    @Column(name = "settlement_batch_id", length = 50)
    private String settlementBatchId;

    @Column(name = "is_demo_simulated", nullable = false)
    @Builder.Default
    private Boolean isDemoSimulated = Boolean.TRUE;

    @Column(name = "simulation_notes", length = 500)
    private String simulationNotes;

    @Column(name = "source_bank_account_id")
    private Long sourceBankAccountId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "initiated_by_user_id")
    private Long initiatedByUserId;

    @Column(name = "initiated_at", nullable = false)
    private LocalDateTime initiatedAt;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(name = "reconciled_at")
    private LocalDateTime reconciledAt;
}
