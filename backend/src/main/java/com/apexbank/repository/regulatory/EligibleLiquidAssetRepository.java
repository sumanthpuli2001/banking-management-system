package com.apexbank.repository.regulatory;

import com.apexbank.entity.regulatory.EligibleLiquidAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface EligibleLiquidAssetRepository extends JpaRepository<EligibleLiquidAsset, Long> {

    List<EligibleLiquidAsset> findByIsEncumberedFalseOrderByMarketValueDesc();

    List<EligibleLiquidAsset> findByAssetTypeAndIsEncumberedFalse(String assetType);

    @Query("SELECT COALESCE(SUM(e.marketValue), 0) FROM EligibleLiquidAsset e WHERE e.isEncumbered = false")
    BigDecimal sumTotalEligibleLiquidAssets();
}
