package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inter_branch_cash_transfers", indexes = {
    @Index(name = "idx_ibct_num", columnList = "transfer_number"),
    @Index(name = "idx_ibct_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InterBranchCashTransfer extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transfer_number", nullable = false, unique = true, length = 64)
    private String transferNumber; // IBCT-20261115-XXXX

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_branch_id", nullable = false)
    private Branch sourceBranch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_branch_id", nullable = false)
    private Branch destinationBranch;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DISPATCHED_IN_TRANSIT"; // REQUESTED, DISPATCHED_IN_TRANSIT, RECEIVED_SETTLED, REJECTED

    @Column(name = "transit_carrier", length = 120)
    @Builder.Default
    private String transitCarrier = "Secure Armored Logistics Ltd";

    @Column(name = "security_seal_number", length = 60)
    private String securitySealNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatching_officer_id", nullable = false)
    private User dispatchingOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiving_officer_id")
    private User receivingOfficer;

    @Column(name = "dispatch_remarks", length = 500)
    private String dispatchRemarks;

    @Column(name = "receipt_remarks", length = 500)
    private String receiptRemarks;

    @Column(name = "dispatched_at", nullable = false)
    @Builder.Default
    private LocalDateTime dispatchedAt = LocalDateTime.now();

    @Column(name = "received_at")
    private LocalDateTime receivedAt;
}
