package com.apexbank.repository.regulatory;

import com.apexbank.entity.regulatory.ReserveCalculationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReserveCalculationHistoryRepository extends JpaRepository<ReserveCalculationHistory, Long> {

    Optional<ReserveCalculationHistory> findTopByOrderByCalculationDateDesc();

    Page<ReserveCalculationHistory> findAllByOrderByCalculationDateDesc(Pageable pageable);

    @Query("SELECT r FROM ReserveCalculationHistory r WHERE r.isRegulatoryVerified = true ORDER BY r.calculationDate DESC")
    Page<ReserveCalculationHistory> findVerifiedReports(Pageable pageable);
}
