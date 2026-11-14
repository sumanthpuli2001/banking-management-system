package com.apexbank.repository;

import com.apexbank.entity.LoanApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    Optional<LoanApplication> findByApplicationNumber(String applicationNumber);
    Page<LoanApplication> findByBranchId(Long branchId, Pageable pageable);
    Page<LoanApplication> findByStatus(String status, Pageable pageable);
    List<LoanApplication> findByCustomerId(Long customerId);
    long countByStatus(String status);
}
