package com.apexbank.repository;

import com.apexbank.entity.LoanRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, Long> {
    List<LoanRepayment> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);

    java.util.Optional<LoanRepayment> findFirstByLoanIdAndStatusOrderByInstallmentNumberAsc(Long loanId, String status);

    List<LoanRepayment> findByDueDateBeforeAndStatus(java.time.LocalDateTime cutoff, String status);

    long countByLoanIdAndStatus(Long loanId, String status);
}
