package com.apexbank.repository.paymentrail;

import com.apexbank.entity.paymentrail.PaymentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentStatusHistoryRepository extends JpaRepository<PaymentStatusHistory, Long> {

    List<PaymentStatusHistory> findByPaymentRecordIdOrderByTransitionTimestampAsc(Long paymentRecordId);

    List<PaymentStatusHistory> findByPaymentReferenceOrderByTransitionTimestampAsc(String paymentReference);
}
