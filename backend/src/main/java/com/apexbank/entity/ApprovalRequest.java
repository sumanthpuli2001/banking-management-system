package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ApprovalRequest extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_type", nullable = false, length = 50)
    private String requestType; // HIGH_VALUE_TRANSFER, LOAN_SANCTION, ACCOUNT_FREEZE, ACCOUNT_CLOSURE, BRANCH_CREATION

    @Column(name = "target_entity_name", length = 50)
    private String targetEntityName; // Transaction, LoanApplication, BankAccount, Branch

    @Column(name = "target_entity_id")
    private Long targetEntityId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "maker_id", nullable = false)
    private User maker; // The initiator

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checker_id")
    private User checker; // The approver/rejector

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "maker_remarks", length = 255)
    private String makerRemarks;

    @Column(name = "checker_remarks", length = 255)
    private String checkerRemarks;

    @Column(name = "requested_at", columnDefinition = "DATETIME", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "decided_at", columnDefinition = "DATETIME")
    private LocalDateTime decidedAt;
}
