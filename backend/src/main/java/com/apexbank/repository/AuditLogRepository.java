package com.apexbank.repository;

import com.apexbank.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByBranchId(Long branchId, Pageable pageable);
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    List<AuditLog> findTop20ByOrderByEventTimestampDesc();
}
