package com.apexbank.service;

import com.apexbank.entity.AuditLog;
import com.apexbank.entity.LoginHistory;
import com.apexbank.entity.User;
import com.apexbank.repository.AuditLogRepository;
import com.apexbank.repository.LoginHistoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final LoginHistoryRepository loginHistoryRepository;

    public AuditService(AuditLogRepository auditLogRepository,
                        LoginHistoryRepository loginHistoryRepository) {
        this.auditLogRepository = auditLogRepository;
        this.loginHistoryRepository = loginHistoryRepository;
    }

    @Transactional
    public AuditLog recordAudit(User user, String action, String module, String referenceId, String details, String ipAddress, String status) {
        AuditLog log = AuditLog.builder()
                .userId(user != null ? user.getId() : null)
                .username(user != null ? user.getUsername() : "ANONYMOUS")
                .userRole(user != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next().getName().name() : "NONE")
                .branchId(user != null && user.getBranch() != null ? user.getBranch().getId() : null)
                .branchName(user != null && user.getBranch() != null ? user.getBranch().getName() : "HEAD_OFFICE")
                .action(action)
                .module(module)
                .referenceId(referenceId)
                .correlationId(UUID.randomUUID().toString())
                .details(details)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .status(status != null ? status : "SUCCESS")
                .eventTimestamp(LocalDateTime.now())
                .build();
        return auditLogRepository.save(log);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void recordLogin(String username, Long userId, String status, String ip, String userAgent, String failureReason) {
        LoginHistory history = LoginHistory.builder()
                .username(username)
                .userId(userId)
                .loginStatus(status)
                .ipAddress(ip != null ? ip : "127.0.0.1")
                .userAgent(userAgent != null ? userAgent : "Browser Agent")
                .failureReason(failureReason)
                .loginTime(LocalDateTime.now())
                .build();
        loginHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop20ByOrderByEventTimestampDesc();
    }

    @Transactional(readOnly = true)
    public List<LoginHistory> getRecentLoginHistory() {
        return loginHistoryRepository.findTop10ByOrderByLoginTimeDesc();
    }
}
