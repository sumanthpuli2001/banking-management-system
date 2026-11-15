package com.apexbank.repository;

import com.apexbank.entity.ReconciliationReport;
import com.apexbank.entity.ReconciliationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReconciliationReportRepository extends JpaRepository<ReconciliationReport, Long> {
    Optional<ReconciliationReport> findByReportNumber(String reportNumber);
    List<ReconciliationReport> findByRunDate(LocalDate runDate);
    Page<ReconciliationReport> findByOrderByCreatedAtDesc(Pageable pageable);
    List<ReconciliationReport> findTop5ByOrderByCreatedAtDesc();
    List<ReconciliationReport> findByReconciliationTypeOrderByCreatedAtDesc(ReconciliationType type);
}
