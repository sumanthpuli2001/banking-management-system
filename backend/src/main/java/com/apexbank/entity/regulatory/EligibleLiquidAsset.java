package com.apexbank.entity.regulatory;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "eligible_liquid_assets", indexes = {
        @Index(name = "idx_ela_type", columnList = "asset_type"),
        @Index(name = "idx_ela_isin", columnList = "asset_identifier")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EligibleLiquidAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_identifier", nullable = false, length = 50)
    private String assetIdentifier; // ISIN e.g., IN0020230085 or GSEC-7.18-2033

    @Column(name = "asset_name", nullable = false, length = 120)
    private String assetName;

    @Column(name = "asset_type", nullable = false, length = 50)
    private String assetType; // CENTRAL_GOVT_SECURITY, STATE_DEV_LOAN, TREASURY_BILL, PHYSICAL_VAULT_CASH, EXCESS_CRR_BALANCE, SOVEREIGN_GOLD

    @Column(name = "face_value", precision = 18, scale = 4, nullable = false)
    private BigDecimal faceValue;

    @Column(name = "book_value", precision = 18, scale = 4, nullable = false)
    private BigDecimal bookValue;

    @Column(name = "market_value", precision = 18, scale = 4, nullable = false)
    private BigDecimal marketValue;

    @Column(name = "coupon_rate", precision = 6, scale = 4)
    private BigDecimal couponRate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "is_encumbered", nullable = false)
    @Builder.Default
    private Boolean isEncumbered = Boolean.FALSE; // Must be unencumbered to qualify for SLR

    @Column(name = "custody_depository", length = 80)
    @Builder.Default
    private String custodyDepository = "RBI_SGL_ACCOUNT";

    @Column(name = "valuation_date", nullable = false)
    private LocalDate valuationDate;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
