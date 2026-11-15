package com.apexbank.repository.loan;

import com.apexbank.entity.loan.LoanSanctionLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanSanctionLetterRepository extends JpaRepository<LoanSanctionLetter, Long> {

    Optional<LoanSanctionLetter> findBySanctionReference(String sanctionReference);

    Optional<LoanSanctionLetter> findByLoanApplicationId(Long loanApplicationId);
}
