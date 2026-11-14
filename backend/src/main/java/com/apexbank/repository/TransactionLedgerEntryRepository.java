package com.apexbank.repository;

import com.apexbank.entity.TransactionLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionLedgerEntryRepository extends JpaRepository<TransactionLedgerEntry, Long> {
    List<TransactionLedgerEntry> findByTransactionId(Long transactionId);
    Page<TransactionLedgerEntry> findByAccountIdOrderByEntryTimestampDesc(Long accountId, Pageable pageable);
}
