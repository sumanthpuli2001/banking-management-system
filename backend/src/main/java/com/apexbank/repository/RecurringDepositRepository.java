package com.apexbank.repository;

import com.apexbank.entity.RecurringDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringDepositRepository extends JpaRepository<RecurringDeposit, Long> {
    List<RecurringDeposit> findByAccountId(Long accountId);
}
