package com.apexbank.repository.regulatory;

import com.apexbank.entity.regulatory.RegulatoryReportingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegulatoryReportingPeriodRepository extends JpaRepository<RegulatoryReportingPeriod, Long> {

    Optional<RegulatoryReportingPeriod> findByPeriodName(String periodName);

    List<RegulatoryReportingPeriod> findAllByOrderByReportingStartDateDesc();

    Optional<RegulatoryReportingPeriod> findFirstByReportingStartDateLessThanEqualAndReportingEndDateGreaterThanEqual(
            LocalDate date1, LocalDate date2
    );
}
