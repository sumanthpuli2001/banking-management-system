package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "teller_cash_drawers", indexes = {
    @Index(name = "idx_drawer_code", columnList = "drawer_code"),
    @Index(name = "idx_drawer_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TellerCashDrawer extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "drawer_code", nullable = false, unique = true, length = 40)
    private String drawerCode; // DRW-BLR-01, DRW-MUM-01

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_cashier_id")
    private User assignedCashier;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, CLOSED, LOCKED, HANDOVER_PENDING

    @Column(name = "opening_balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "cash_receipts", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal cashReceipts = BigDecimal.ZERO;

    @Column(name = "cash_payments", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal cashPayments = BigDecimal.ZERO;

    @Column(name = "current_balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "opened_at", nullable = false)
    @Builder.Default
    private LocalDateTime openedAt = LocalDateTime.now();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    public void addReceipt(BigDecimal amount) {
        this.cashReceipts = this.cashReceipts.add(amount);
        this.currentBalance = this.currentBalance.add(amount);
    }

    public void addPayment(BigDecimal amount) {
        this.cashPayments = this.cashPayments.add(amount);
        this.currentBalance = this.currentBalance.subtract(amount);
    }
}
