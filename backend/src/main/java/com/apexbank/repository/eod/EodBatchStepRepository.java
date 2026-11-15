package com.apexbank.repository.eod;

import com.apexbank.entity.eod.EodBatchStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EodBatchStepRepository extends JpaRepository<EodBatchStep, Long> {

    List<EodBatchStep> findByBatchRunIdOrderByStepNumberAsc(Long batchRunId);
}
