package com.apexbank.repository;

import com.apexbank.entity.JournalEntryLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, Long> {

    List<JournalEntryLine> findByJournalEntryIdOrderByLineNumberAsc(Long journalEntryId);

    @Query("SELECT l FROM JournalEntryLine l WHERE l.glAccount.accountCode = :accountCode " +
           "AND (:startDate IS NULL OR l.journalEntry.postingDate >= :startDate) " +
           "AND (:endDate IS NULL OR l.journalEntry.postingDate <= :endDate) " +
           "ORDER BY l.journalEntry.postedAt ASC, l.lineNumber ASC")
    Page<JournalEntryLine> findByAccountCodeAndDateRange(@Param("accountCode") String accountCode,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate,
                                                         Pageable pageable);
}
