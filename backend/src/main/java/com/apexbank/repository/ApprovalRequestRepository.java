package com.apexbank.repository;

import com.apexbank.entity.ApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    Page<ApprovalRequest> findByStatus(String status, Pageable pageable);

    Page<ApprovalRequest> findByBranchIdAndStatus(Long branchId, String status, Pageable pageable);

    long countByStatus(String status);

    long countByIsEscalatedTrueAndStatus(String status);

    List<ApprovalRequest> findTop10ByStatusOrderByRequestedAtDesc(String status);

    @Query("SELECT a FROM ApprovalRequest a WHERE a.status = 'PENDING' AND a.expiresAt IS NOT NULL AND a.expiresAt < :now")
    List<ApprovalRequest> findExpiredPendingRequests(@Param("now") LocalDateTime now);

    @Query("SELECT a FROM ApprovalRequest a WHERE a.status = 'PENDING' AND a.isEscalated = false AND a.requestedAt < :threshold")
    List<ApprovalRequest> findOverduePendingRequestsForEscalation(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT a FROM ApprovalRequest a WHERE a.status != 'PENDING' ORDER BY a.decidedAt DESC")
    Page<ApprovalRequest> findApprovalHistory(Pageable pageable);

    @Query("SELECT a FROM ApprovalRequest a WHERE (:status IS NULL OR a.status = :status) " +
           "AND (:requiredRole IS NULL OR a.requiredRole = :requiredRole) " +
           "AND (:riskLevel IS NULL OR a.riskLevel = :riskLevel) " +
           "ORDER BY a.requestedAt DESC")
    Page<ApprovalRequest> searchPendingRequests(
            @Param("status") String status,
            @Param("requiredRole") String requiredRole,
            @Param("riskLevel") String riskLevel,
            Pageable pageable);
}
