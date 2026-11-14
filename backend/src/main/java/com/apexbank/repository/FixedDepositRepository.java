package com.apexbank.repository;

import com.apexbank.entity.FixedDeposit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FixedDepositRepository extends JpaRepository<FixedDeposit, Long> {
    Optional<FixedDeposit> findByCertificateNumber(String certificateNumber);
    List<FixedDeposit> findByCustomerId(Long customerId);
    Page<FixedDeposit> findByBranchId(Long branchId, Pageable pageable);
}
