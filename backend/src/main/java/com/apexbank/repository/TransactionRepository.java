package com.apexbank.repository;

import com.apexbank.entity.Transaction;
import com.apexbank.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByReferenceNumber(String referenceNumber);
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);

    Page<Transaction> findByBranchId(Long branchId, Pageable pageable);
    Page<Transaction> findBySourceAccountIdOrDestinationAccountId(Long srcId, Long destId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(:branchId IS NULL OR t.branch.id = :branchId) AND " +
           "(:type IS NULL OR t.transactionType = :type) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(t.transactionTimestamp BETWEEN :startDate AND :endDate)")
    Page<Transaction> findFilteredTransactions(
            @Param("branchId") Long branchId,
            @Param("type") TransactionType type,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'CASH_DEPOSIT' AND t.status = 'SUCCESS' AND t.transactionTimestamp >= :since")
    BigDecimal sumTodayDeposits(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'CASH_WITHDRAWAL' AND t.status = 'SUCCESS' AND t.transactionTimestamp >= :since")
    BigDecimal sumTodayWithdrawals(@Param("since") LocalDateTime since);

    @Query("SELECT t FROM Transaction t WHERE (t.sourceAccount.id = :accountId OR t.destinationAccount.id = :accountId) AND t.transactionTimestamp >= :since ORDER BY t.transactionTimestamp DESC")
    List<Transaction> findRecentTransactionsByAccount(@Param("accountId") Long accountId, @Param("since") LocalDateTime since);

    @Query("SELECT t FROM Transaction t WHERE (t.sourceAccount.id = :accountId OR t.destinationAccount.id = :accountId) AND (t.transactionType = 'CASH_DEPOSIT' OR t.transactionType = 'CASH_WITHDRAWAL') AND t.transactionTimestamp >= :since ORDER BY t.transactionTimestamp DESC")
    List<Transaction> findRecentCashTransactionsByAccount(@Param("accountId") Long accountId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE (t.sourceAccount.id = :accountId OR t.destinationAccount.id = :accountId) AND t.transactionTimestamp < :before")
    long countHistoricalTransactionsBefore(@Param("accountId") Long accountId, @Param("before") LocalDateTime before);

    List<Transaction> findTop20ByOrderByTransactionTimestampDesc();
}
