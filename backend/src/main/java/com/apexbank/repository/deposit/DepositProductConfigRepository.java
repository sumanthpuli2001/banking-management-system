package com.apexbank.repository.deposit;

import com.apexbank.entity.deposit.DepositProductConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepositProductConfigRepository extends JpaRepository<DepositProductConfig, Long> {
    Optional<DepositProductConfig> findByProductCode(String productCode);
    List<DepositProductConfig> findByIsActiveTrue();
    List<DepositProductConfig> findByDepositTypeAndIsActiveTrue(String depositType);
}
