package com.apexbank.repository;

import com.apexbank.entity.BankAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    Optional<BankAccount> findByAccountNumber(String accountNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM BankAccount b WHERE b.accountNumber = :accountNumber")
    Optional<BankAccount> findByAccountNumberForUpdate(@Param("accountNumber") String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    List<BankAccount> findByCustomerId(Long customerId);
    Page<BankAccount> findByBranchId(Long branchId, Pageable pageable);
    Page<BankAccount> findByStatus(String status, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.balance), 0) FROM BankAccount b WHERE b.branch.id = :branchId")
    BigDecimal sumBalanceByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(b.balance), 0) FROM BankAccount b")
    BigDecimal sumTotalBankDeposits();
}
