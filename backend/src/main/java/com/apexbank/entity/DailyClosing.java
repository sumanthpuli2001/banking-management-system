package com.apexbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_closings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosing extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "closing_date", nullable = false)
    private LocalDate closingDate;

    @Column(name = "opening_cash", nullable = false, precision = 19, scale = 4)
    private BigDecimal openingCash;

    @Column(name = "total_cash_receipts", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalCashReceipts;

    @Column(name = "total_cash_payments", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalCashPayments;

    @Column(name = "expected_closing_cash", nullable = false, precision = 19, scale = 4)
    private BigDecimal expectedClosingCash;

    @Column(name = "physical_cash_counted", nullable = false, precision = 19, scale = 4)
    private BigDecimal physicalCashCounted;

    @Column(name = "discrepancy", nullable = false, precision = 19, scale = 4)
    private BigDecimal discrepancy;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "BALANCED"; // "BALANCED", "SHORTAGE", "EXCESS", "VERIFIED"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_user_id")
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedBy;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "closed_at", nullable = false)
    @Builder.Default
    private LocalDateTime closedAt = LocalDateTime.now();
}
