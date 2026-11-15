package com.apexbank.repository.paymentrail;

import com.apexbank.entity.paymentrail.PaymentRailStatus;
import com.apexbank.entity.paymentrail.PaymentRailType;
import com.apexbank.entity.paymentrail.PaymentTransactionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRecordRepository extends JpaRepository<PaymentTransactionRecord, Long> {

    Optional<PaymentTransactionRecord> findByPaymentReference(String paymentReference);

    Optional<PaymentTransactionRecord> findByUtrNumber(String utrNumber);

    Optional<PaymentTransactionRecord> findByRrnNumber(String rrnNumber);

    Optional<PaymentTransactionRecord> findByIdempotencyKey(String idempotencyKey);

    Page<PaymentTransactionRecord> findBySourceAccountNumberOrderByInitiatedAtDesc(String sourceAccountNumber, Pageable pageable);

    Page<PaymentTransactionRecord> findByRailTypeOrderByInitiatedAtDesc(PaymentRailType railType, Pageable pageable);

    Page<PaymentTransactionRecord> findByStatusOrderByInitiatedAtDesc(PaymentRailStatus status, Pageable pageable);

    @Query("SELECT p FROM PaymentTransactionRecord p WHERE " +
           "(:railType IS NULL OR p.railType = :railType) AND " +
           "(:status IS NULL OR p.status = :status) " +
           "ORDER BY p.initiatedAt DESC")
    Page<PaymentTransactionRecord> findFiltered(
            @Param("railType") PaymentRailType railType,
            @Param("status") PaymentRailStatus status,
            Pageable pageable);
}
