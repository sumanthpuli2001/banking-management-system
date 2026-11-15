package com.apexbank.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounting_rule_mappings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingRuleMapping extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_code", nullable = false, unique = true, length = 60)
    private String eventCode;

    @Column(name = "debit_account_code", nullable = false, length = 50)
    private String debitAccountCode;

    @Column(name = "credit_account_code", nullable = false, length = 50)
    private String creditAccountCode;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
