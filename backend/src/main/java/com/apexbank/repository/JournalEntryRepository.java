package com.apexbank.repository;

import com.apexbank.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    Optional<JournalEntry> findByTransactionReference(String transactionReference);

    @Query("SELECT j FROM JournalEntry j WHERE (:branchId IS NULL OR j.branch.id = :branchId) " +
           "AND (:startDate IS NULL OR j.postingDate >= :startDate) " +
           "AND (:endDate IS NULL OR j.postingDate <= :endDate) " +
           "AND (:status IS NULL OR j.status = :status) " +
           "ORDER BY j.postedAt DESC")
    Page<JournalEntry> findFiltered(@Param("branchId") Long branchId,
                                    @Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate,
                                    @Param("status") String status,
                                    Pageable pageable);
}
