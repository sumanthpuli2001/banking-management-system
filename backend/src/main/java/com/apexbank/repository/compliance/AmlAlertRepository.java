package com.apexbank.repository.compliance;

import com.apexbank.entity.compliance.AmlAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmlAlertRepository extends JpaRepository<AmlAlert, Long> {

    Optional<AmlAlert> findByAlertNumber(String alertNumber);

    Page<AmlAlert> findByStatus(String status, Pageable pageable);

    Page<AmlAlert> findBySeverity(String severity, Pageable pageable);

    List<AmlAlert> findByCustomerIdOrderByDetectedTimestampDesc(Long customerId);

    @Query("SELECT a FROM AmlAlert a WHERE (:status IS NULL OR a.status = :status) " +
           "AND (:severity IS NULL OR a.severity = :severity) " +
           "AND (:ruleCode IS NULL OR a.ruleCode = :ruleCode) " +
           "ORDER BY a.detectedTimestamp DESC")
    Page<AmlAlert> findFilteredAlerts(
            @Param("status") String status,
            @Param("severity") String severity,
            @Param("ruleCode") String ruleCode,
            Pageable pageable
    );

    long countByStatus(String status);

    long countBySeverity(String severity);

    @Query("SELECT COUNT(a) FROM AmlAlert a WHERE a.status = 'STR_FILED'")
    long countStrFiled();
}
