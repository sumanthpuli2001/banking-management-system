package com.apexbank.repository.compliance;

import com.apexbank.entity.compliance.AmlRuleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmlRuleConfigRepository extends JpaRepository<AmlRuleConfig, Long> {

    Optional<AmlRuleConfig> findByRuleCode(String ruleCode);

    List<AmlRuleConfig> findByIsActiveTrue();
}
