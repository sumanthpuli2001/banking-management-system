package com.apexbank.repository;

import com.apexbank.entity.CashShortageExcessRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashShortageExcessRepository extends JpaRepository<CashShortageExcessRecord, Long> {
    Optional<CashShortageExcessRecord> findByIncidentNumber(String incidentNumber);
    List<CashShortageExcessRecord> findByBranchIdAndStatus(Long branchId, String status);
    Page<CashShortageExcessRecord> findByStatusOrderByReportedAtDesc(String status, Pageable pageable);
    Page<CashShortageExcessRecord> findAllByOrderByReportedAtDesc(Pageable pageable);
    long countByStatus(String status);
}
