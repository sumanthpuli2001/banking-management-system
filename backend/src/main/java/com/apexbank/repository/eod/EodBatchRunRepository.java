package com.apexbank.repository.eod;

import com.apexbank.entity.eod.EodBatchRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface EodBatchRunRepository extends JpaRepository<EodBatchRun, Long> {

    Optional<EodBatchRun> findTopByOrderByStartedAtDesc();

    Optional<EodBatchRun> findByBatchDateAndBatchType(LocalDate batchDate, String batchType);

    Page<EodBatchRun> findAllByOrderByStartedAtDesc(Pageable pageable);
}
