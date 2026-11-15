package com.apexbank.repository;

import com.apexbank.entity.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    Optional<Loan> findByLoanAccountNumber(String loanAccountNumber);
    Page<Loan> findByBranchId(Long branchId, Pageable pageable);
    List<Loan> findByCustomerId(Long customerId);

    @Query("SELECT COALESCE(SUM(l.outstandingPrincipal), 0) FROM Loan l WHERE l.status = 'ACTIVE'")
    BigDecimal sumTotalActiveAdvances();

    @Query("SELECT COALESCE(SUM(l.outstandingPrincipal), 0) FROM Loan l WHERE l.branch.id = :branchId AND l.status = 'ACTIVE'")
    BigDecimal sumAdvancesByBranchId(@Param("branchId") Long branchId);

    Page<Loan> findByAssetClassification(String classification, Pageable pageable);

    long countByAssetClassification(String classification);

    @Query("SELECT COALESCE(SUM(l.requiredProvisionAmount), 0) FROM Loan l WHERE l.status = 'ACTIVE'")
    BigDecimal sumTotalRequiredProvisions();

    @Query("SELECT l FROM Loan l WHERE (:branchId IS NULL OR l.branch.id = :branchId) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:classification IS NULL OR l.assetClassification = :classification) " +
           "ORDER BY l.daysPastDue DESC, l.id DESC")
    Page<Loan> findFilteredLoans(
            @Param("branchId") Long branchId,
            @Param("status") String status,
            @Param("classification") String classification,
            Pageable pageable
    );
}
