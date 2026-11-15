package com.apexbank.repository;

import com.apexbank.entity.TellerCashDrawer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TellerCashDrawerRepository extends JpaRepository<TellerCashDrawer, Long> {
    Optional<TellerCashDrawer> findByDrawerCode(String drawerCode);
    Optional<TellerCashDrawer> findByAssignedCashierIdAndStatus(Long cashierId, String status);
    List<TellerCashDrawer> findByBranchIdAndStatus(Long branchId, String status);
    List<TellerCashDrawer> findByBranchId(Long branchId);
}
