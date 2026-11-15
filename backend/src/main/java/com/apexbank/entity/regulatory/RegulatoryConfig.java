package com.apexbank.entity.regulatory;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "regulatory_configs", indexes = {
        @Index(name = "idx_reg_param_key", columnList = "parameter_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegulatoryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parameter_key", nullable = false, unique = true, length = 80)
    private String parameterKey;

    @Column(name = "parameter_name", nullable = false, length = 120)
    private String parameterName;

    @Column(name = "parameter_value", precision = 8, scale = 4, nullable = false)
    private BigDecimal parameterValue;

    @Column(name = "unit", length = 20)
    @Builder.Default
    private String unit = "%";

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "source_circular_reference", length = 150)
    private String sourceCircularReference;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = Boolean.TRUE;

    @Column(name = "updated_by", length = 60)
    private String updatedBy;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
