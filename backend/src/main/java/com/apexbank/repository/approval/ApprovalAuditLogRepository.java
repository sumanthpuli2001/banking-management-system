package com.apexbank.repository.approval;

import com.apexbank.entity.approval.ApprovalAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalAuditLogRepository extends JpaRepository<ApprovalAuditLog, Long> {

    List<ApprovalAuditLog> findByApprovalRequestIdOrderByRecordedAtDesc(Long approvalRequestId);

    Page<ApprovalAuditLog> findAllByOrderByRecordedAtDesc(Pageable pageable);

    Page<ApprovalAuditLog> findByPerformedByUsernameOrderByRecordedAtDesc(String performedByUsername, Pageable pageable);
}
