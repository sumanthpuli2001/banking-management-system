package com.apexbank.repository.regulatory;

import com.apexbank.entity.regulatory.RegulatoryConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegulatoryConfigRepository extends JpaRepository<RegulatoryConfig, Long> {

    Optional<RegulatoryConfig> findByParameterKeyAndIsActiveTrue(String parameterKey);

    Optional<RegulatoryConfig> findByParameterKey(String parameterKey);

    List<RegulatoryConfig> findByIsActiveTrueOrderByParameterKeyAsc();
}
