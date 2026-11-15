package com.apexbank.repository;

import com.apexbank.entity.FixedDeposit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FixedDepositRepository extends JpaRepository<FixedDeposit, Long> {
    Optional<FixedDeposit> findByCertificateNumber(String certificateNumber);
    List<FixedDeposit> findByCustomerId(Long customerId);
    List<FixedDeposit> findByCustomerIdOrderByDepositDateDesc(Long customerId);
    Page<FixedDeposit> findByBranchId(Long branchId, Pageable pageable);
    Page<FixedDeposit> findByStatus(String status, Pageable pageable);

    @Query("SELECT fd FROM FixedDeposit fd WHERE " +
           "(:branchId IS NULL OR fd.branch.id = :branchId) AND " +
           "(:customerId IS NULL OR fd.customer.id = :customerId) AND " +
           "(:status IS NULL OR fd.status = :status) AND " +
           "(:depositType IS NULL OR fd.depositType = :depositType) " +
           "ORDER BY fd.depositDate DESC")
    Page<FixedDeposit> findFilteredDeposits(
            @Param("branchId") Long branchId,
            @Param("customerId") Long customerId,
            @Param("status") String status,
            @Param("depositType") String depositType,
            Pageable pageable);
}
