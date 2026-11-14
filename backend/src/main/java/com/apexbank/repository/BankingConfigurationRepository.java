package com.apexbank.repository;

import com.apexbank.entity.BankingConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankingConfigurationRepository extends JpaRepository<BankingConfiguration, Long> {
    Optional<BankingConfiguration> findByConfigKey(String configKey);
}
