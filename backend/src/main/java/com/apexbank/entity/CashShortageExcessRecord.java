package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cash_shortage_excess_records", indexes = {
    @Index(name = "idx_var_inc_num", columnList = "incident_number"),
    @Index(name = "idx_var_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CashShortageExcessRecord extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_number", nullable = false, unique = true, length = 64)
    private String incidentNumber; // CSH-VAR-20261115-XXXX

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drawer_id")
    private TellerCashDrawer drawer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cashier_user_id", nullable = false)
    private User cashier;

    @Column(name = "incident_type", nullable = false, length = 20)
    private String incidentType; // SHORTAGE, EXCESS

    @Column(name = "expected_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "physical_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal physicalAmount;

    @Column(name = "variance_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal varianceAmount;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "REPORTED"; // REPORTED, UNDER_INVESTIGATION, RESOLVED, WRITTEN_OFF

    @Column(name = "investigation_notes", length = 500)
    private String investigationNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedBy;

    @Column(name = "reported_at", nullable = false)
    @Builder.Default
    private LocalDateTime reportedAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
