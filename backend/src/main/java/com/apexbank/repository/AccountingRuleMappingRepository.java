package com.apexbank.repository;

import com.apexbank.entity.AccountingRuleMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountingRuleMappingRepository extends JpaRepository<AccountingRuleMapping, Long> {

    Optional<AccountingRuleMapping> findByEventCodeAndIsActiveTrue(String eventCode);
}
