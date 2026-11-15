package com.apexbank.repository;

import com.apexbank.entity.AccountingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AccountingPeriodRepository extends JpaRepository<AccountingPeriod, Long> {

    Optional<AccountingPeriod> findByPeriodName(String periodName);

    @Query("SELECT p FROM AccountingPeriod p WHERE :date >= p.startDate AND :date <= p.endDate AND p.status = 'OPEN'")
    Optional<AccountingPeriod> findActivePeriodForDate(@Param("date") LocalDate date);
}
