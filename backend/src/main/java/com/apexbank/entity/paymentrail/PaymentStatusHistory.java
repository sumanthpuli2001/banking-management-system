package com.apexbank.entity.paymentrail;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_status_histories", indexes = {
        @Index(name = "idx_pay_hist_record", columnList = "payment_record_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PaymentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_record_id", nullable = false)
    private Long paymentRecordId;

    @Column(name = "payment_reference", nullable = false, length = 64)
    private String paymentReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private PaymentRailStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private PaymentRailStatus newStatus;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "transition_timestamp", nullable = false)
    private LocalDateTime transitionTimestamp;
}
