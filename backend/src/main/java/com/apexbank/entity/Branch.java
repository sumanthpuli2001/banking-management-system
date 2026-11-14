package com.apexbank.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "branches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Branch extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_code", nullable = false, unique = true, length = 30)
    private String branchCode;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "ifsc_code", nullable = false, unique = true, length = 20)
    private String ifscCode;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 80)
    private String city;

    @Column(name = "state", length = 80)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, PENDING_APPROVAL

    @Column(name = "is_head_office", nullable = false)
    @Builder.Default
    private Boolean isHeadOffice = false;

    @Column(name = "cash_vault_balance", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cashVaultBalance = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id")
    @JsonIgnoreProperties("branches")
    private Region region;
}
