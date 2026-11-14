package com.apexbank.repository;

import com.apexbank.entity.ApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    Page<ApprovalRequest> findByStatus(String status, Pageable pageable);
    Page<ApprovalRequest> findByBranchIdAndStatus(Long branchId, String status, Pageable pageable);
    long countByStatus(String status);
    List<ApprovalRequest> findTop10ByStatusOrderByRequestedAtDesc(String status);
}
