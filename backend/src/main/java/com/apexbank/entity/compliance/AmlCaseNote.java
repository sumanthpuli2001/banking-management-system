package com.apexbank.entity.compliance;

import com.apexbank.entity.BaseAuditableEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "aml_case_notes", indexes = {
        @Index(name = "idx_case_note_alert", columnList = "alert_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AmlCaseNote extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false)
    private Long alertId;

    @Column(name = "author_username", nullable = false, length = 60)
    private String authorUsername;

    @Column(name = "action_taken", nullable = false, length = 60)
    private String actionTaken; // INVESTIGATION_NOTE, EVIDENCE_ATTACHED, ESCALATED_MLRO, STR_FILED, CLOSED_FALSE_POSITIVE, CLOSED_EXPLAINED

    @Column(name = "note_text", nullable = false, columnDefinition = "TEXT")
    private String noteText;

    @Column(name = "is_confidential")
    @Builder.Default
    private Boolean isConfidential = false;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
