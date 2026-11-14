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
}
