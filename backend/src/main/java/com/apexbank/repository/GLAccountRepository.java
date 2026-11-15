package com.apexbank.repository;

import com.apexbank.entity.AccountClassification;
import com.apexbank.entity.GLAccount;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface GLAccountRepository extends JpaRepository<GLAccount, Long> {

    Optional<GLAccount> findByAccountCode(String accountCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GLAccount g WHERE g.accountCode = :code")
    Optional<GLAccount> findByAccountCodeForUpdate(@Param("code") String code);

    List<GLAccount> findByClassification(AccountClassification classification, Sort sort);

    List<GLAccount> findByBranchId(Long branchId);

    @Query("SELECT g FROM GLAccount g WHERE g.branch IS NULL OR g.branch.id = :branchId ORDER BY g.accountCode ASC")
    List<GLAccount> findAllForBranchOrConsolidated(@Param("branchId") Long branchId);
}
