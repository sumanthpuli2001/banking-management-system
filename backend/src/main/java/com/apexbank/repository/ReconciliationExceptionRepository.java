package com.apexbank.repository;

import com.apexbank.entity.ReconciliationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReconciliationExceptionRepository extends JpaRepository<ReconciliationException, Long> {
    Optional<ReconciliationException> findByExceptionNumber(String exceptionNumber);
    List<ReconciliationException> findByStatus(String status);
    Page<ReconciliationException> findByStatusOrderByDetectedAtDesc(String status, Pageable pageable);
    Page<ReconciliationException> findAllByOrderByDetectedAtDesc(Pageable pageable);
    long countByStatus(String status);
}
