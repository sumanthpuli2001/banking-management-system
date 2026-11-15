package com.apexbank.repository.regulatory;

import com.apexbank.entity.regulatory.LiquidityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiquidityAlertRepository extends JpaRepository<LiquidityAlert, Long> {

    List<LiquidityAlert> findByIsAcknowledgedFalseOrderByCreatedTimestampDesc();

    List<LiquidityAlert> findTop15ByOrderByCreatedTimestampDesc();

    long countByIsAcknowledgedFalse();
}
