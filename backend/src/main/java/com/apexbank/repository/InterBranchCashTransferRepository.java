package com.apexbank.repository;

import com.apexbank.entity.InterBranchCashTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterBranchCashTransferRepository extends JpaRepository<InterBranchCashTransfer, Long> {
    Optional<InterBranchCashTransfer> findByTransferNumber(String transferNumber);
    List<InterBranchCashTransfer> findBySourceBranchIdOrDestinationBranchId(Long sourceBranchId, Long destinationBranchId);
    Page<InterBranchCashTransfer> findAllByOrderByDispatchedAtDesc(Pageable pageable);
    List<InterBranchCashTransfer> findByStatus(String status);
}
