package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "teller_handovers", indexes = {
    @Index(name = "idx_handover_num", columnList = "handover_number"),
    @Index(name = "idx_handover_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TellerHandover extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "handover_number", nullable = false, unique = true, length = 64)
    private String handoverNumber; // HND-20261115-XXXX

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drawer_id", nullable = false)
    private TellerCashDrawer drawer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_teller_id", nullable = false)
    private User sourceTeller;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_teller_id")
    private User destinationTeller;

    @Column(name = "is_vault_return", nullable = false)
    @Builder.Default
    private Boolean isVaultReturn = false;

    @Column(name = "system_expected_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal systemExpectedAmount;

    @Column(name = "physical_count_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal physicalCountAmount;

    @Column(name = "discrepancy_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal discrepancyAmount = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACCEPTED"; // ACCEPTED, REJECTED, FLAGGED_DISCREPANCY

    @Column(name = "handover_remarks", length = 500)
    private String handoverRemarks;

    @Column(name = "supervisor_remarks", length = 500)
    private String supervisorRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authorized_by_id")
    private User authorizedBy;

    @Column(name = "handover_timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime handoverTimestamp = LocalDateTime.now();
}
