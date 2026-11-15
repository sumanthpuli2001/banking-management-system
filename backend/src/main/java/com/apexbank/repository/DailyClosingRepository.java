package com.apexbank.repository;

import com.apexbank.entity.DailyClosing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyClosingRepository extends JpaRepository<DailyClosing, Long> {

    Optional<DailyClosing> findByBranchIdAndClosingDate(Long branchId, LocalDate closingDate);

    @Query("SELECT d FROM DailyClosing d WHERE (:branchId IS NULL OR d.branch.id = :branchId) " +
           "ORDER BY d.closingDate DESC")
    Page<DailyClosing> findRecentClosings(@Param("branchId") Long branchId, Pageable pageable);
}
