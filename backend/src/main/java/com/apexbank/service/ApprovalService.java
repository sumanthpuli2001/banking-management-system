package com.apexbank.service;

import com.apexbank.dto.approval.*;
import com.apexbank.entity.*;
import com.apexbank.entity.approval.ApprovalAuditLog;
import com.apexbank.entity.approval.ApprovalMatrixRule;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import com.apexbank.repository.approval.ApprovalAuditLogRepository;
import com.apexbank.repository.approval.ApprovalMatrixRuleRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalMatrixRuleRepository matrixRuleRepository;
    private final ApprovalAuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;
    private final AccountingEngineService accountingEngineService;

    public ApprovalService(ApprovalRequestRepository approvalRequestRepository,
                           ApprovalMatrixRuleRepository matrixRuleRepository,
                           ApprovalAuditLogRepository auditLogRepository,
                           TransactionRepository transactionRepository,
                           BankAccountRepository bankAccountRepository,
                           TransactionLedgerEntryRepository ledgerEntryRepository,
                           AuditService auditService,
                           AccountingEngineService accountingEngineService) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.matrixRuleRepository = matrixRuleRepository;
        this.auditLogRepository = auditLogRepository;
        this.transactionRepository = transactionRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
        this.accountingEngineService = accountingEngineService;
    }

    @PostConstruct
    @Transactional
    public void initDefaultApprovalMatrixRules() {
        if (matrixRuleRepository.count() > 0) {
            return;
        }
        log.info("Seeding Institutional Dual-Control Approval Matrix Rules...");

        List<ApprovalMatrixRule> rules = List.of(
                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_TXN_TIER1")
                        .ruleName("Tier 1 Branch Manager Transfer Discretion")
                        .operationType("HIGH_VALUE_TRANSFER")
                        .minAmount(new BigDecimal("50000.00"))
                        .maxAmount(new BigDecimal("500000.00"))
                        .requiredCheckerRole("BRANCH_MANAGER")
                        .riskCategory("MEDIUM")
                        .expiryHours(24)
                        .autoEscalateAfterHours(12)
                        .escalateToRole("REGIONAL_MANAGER")
                        .isSelfApprovalAllowed(false)
                        .description("Transfers between ₹50,000 and ₹5,00,000 require Branch Manager dual authorization within 24 hours.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_TXN_TIER2")
                        .ruleName("Tier 2 Regional Manager High-Value Authorization")
                        .operationType("HIGH_VALUE_TRANSFER")
                        .minAmount(new BigDecimal("500000.01"))
                        .maxAmount(new BigDecimal("5000000.00"))
                        .requiredCheckerRole("REGIONAL_MANAGER")
                        .riskCategory("HIGH")
                        .expiryHours(24)
                        .autoEscalateAfterHours(12)
                        .escalateToRole("HEAD_OFFICE_ADMIN")
                        .isSelfApprovalAllowed(false)
                        .description("Commercial & retail transfers between ₹5,00,000 and ₹50,00,000 require Regional Manager sign-off.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_TXN_TIER3")
                        .ruleName("Tier 3 Head Office Institutional Sign-Off")
                        .operationType("HIGH_VALUE_TRANSFER")
                        .minAmount(new BigDecimal("5000000.01"))
                        .maxAmount(new BigDecimal("999999999999.00"))
                        .requiredCheckerRole("HEAD_OFFICE_ADMIN")
                        .riskCategory("CRITICAL")
                        .expiryHours(48)
                        .autoEscalateAfterHours(24)
                        .escalateToRole("SUPER_ADMIN")
                        .isSelfApprovalAllowed(false)
                        .description("Institutional, inter-bank & treasury transfers exceeding ₹50,00,000 require Central Head Office executive sign-off.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_ACCOUNT_FREEZE")
                        .ruleName("Regulatory / AML Account Freeze")
                        .operationType("ACCOUNT_FREEZE")
                        .minAmount(BigDecimal.ZERO)
                        .maxAmount(new BigDecimal("999999999999.00"))
                        .requiredCheckerRole("BRANCH_MANAGER")
                        .riskCategory("HIGH")
                        .expiryHours(12)
                        .autoEscalateAfterHours(6)
                        .escalateToRole("HEAD_OFFICE_ADMIN")
                        .isSelfApprovalAllowed(false)
                        .description("Mandatory dual-control concurrence for regulatory, court-ordered, or AML account freeze.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_ACCOUNT_CLOSURE")
                        .ruleName("Account Closure & Termination Review")
                        .operationType("ACCOUNT_CLOSURE")
                        .minAmount(BigDecimal.ZERO)
                        .maxAmount(new BigDecimal("999999999999.00"))
                        .requiredCheckerRole("BRANCH_MANAGER")
                        .riskCategory("MEDIUM")
                        .expiryHours(24)
                        .autoEscalateAfterHours(12)
                        .escalateToRole("REGIONAL_MANAGER")
                        .isSelfApprovalAllowed(false)
                        .description("Permanent closure of deposit or current accounts requires Branch Management verification.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_CONFIG_CHANGE")
                        .ruleName("Core Configuration & Parameter Override")
                        .operationType("CONFIGURATION_CHANGE")
                        .minAmount(BigDecimal.ZERO)
                        .maxAmount(new BigDecimal("999999999999.00"))
                        .requiredCheckerRole("SUPER_ADMIN")
                        .riskCategory("CRITICAL")
                        .expiryHours(72)
                        .autoEscalateAfterHours(24)
                        .escalateToRole("SUPER_ADMIN")
                        .isSelfApprovalAllowed(false)
                        .description("Modifications to core system parameters, regulatory ratios, and GL chart of accounts.")
                        .isActive(true)
                        .build(),

                ApprovalMatrixRule.builder()
                        .ruleCode("RULE_CASH_OVERRIDE")
                        .ruleName("Teller Cash Drawer Limit Override")
                        .operationType("CASH_LIMIT_OVERRIDE")
                        .minAmount(new BigDecimal("200000.00"))
                        .maxAmount(new BigDecimal("999999999999.00"))
                        .requiredCheckerRole("BRANCH_MANAGER")
                        .riskCategory("HIGH")
                        .expiryHours(8)
                        .autoEscalateAfterHours(4)
                        .escalateToRole("REGIONAL_MANAGER")
                        .isSelfApprovalAllowed(false)
                        .description("Authorizes teller drawer cash retention or single-ticket cash payout exceeding ₹2,00,000 threshold.")
                        .isActive(true)
                        .build()
        );

        matrixRuleRepository.saveAll(rules);
        log.info("Initialized {} approval matrix rules successfully.", rules.size());
    }

    @Transactional(readOnly = true)
    public List<ApprovalMatrixRuleDto> getAllRules() {
        return matrixRuleRepository.findAll().stream()
                .map(this::mapRuleToDto)
                .collect(Collectors.toList());
    }

    public ApprovalMatrixRule evaluateApprovalRequirement(String operationType, BigDecimal amount) {
        List<ApprovalMatrixRule> matched = matrixRuleRepository.findMatchingRules(operationType, amount);
        if (!matched.isEmpty()) {
            return matched.get(0);
        }
        // Fallback default rule
        return ApprovalMatrixRule.builder()
                .ruleCode("DEFAULT_RULE")
                .ruleName("Default Dual-Control Rule")
                .operationType(operationType)
                .requiredCheckerRole("BRANCH_MANAGER")
                .riskCategory("MEDIUM")
                .expiryHours(24)
                .autoEscalateAfterHours(12)
                .escalateToRole("REGIONAL_MANAGER")
                .isSelfApprovalAllowed(false)
                .build();
    }

    @Transactional
    public ApprovalRequestDto submitApprovalRequest(String operationType,
                                                    String targetEntityName,
                                                    Long targetEntityId,
                                                    BigDecimal amount,
                                                    User maker,
                                                    Branch branch,
                                                    String remarks,
                                                    String payloadJson) {
        ApprovalMatrixRule rule = evaluateApprovalRequirement(operationType, amount);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(rule.getExpiryHours() != null ? rule.getExpiryHours() : 24);

        ApprovalRequest request = ApprovalRequest.builder()
                .requestType(operationType)
                .ruleCode(rule.getRuleCode())
                .requiredRole(rule.getRequiredCheckerRole())
                .riskLevel(rule.getRiskCategory() != null ? rule.getRiskCategory() : "MEDIUM")
                .targetEntityName(targetEntityName)
                .targetEntityId(targetEntityId)
                .maker(maker)
                .branch(branch)
                .amount(amount)
                .payloadJson(payloadJson)
                .status("PENDING")
                .makerRemarks(remarks)
                .requestedAt(now)
                .expiresAt(expiresAt)
                .isEscalated(false)
                .build();

        ApprovalRequest saved = approvalRequestRepository.save(request);

        // Record Audit Trail
        recordAuditLog(saved.getId(), "CREATED", maker.getUsername(),
                maker.getRoles().isEmpty() ? "USER" : maker.getRoles().iterator().next().getName().name(),
                "Approval request submitted under matrix rule " + rule.getRuleCode() + " requiring " + rule.getRequiredCheckerRole());

        auditService.recordAudit(maker, "APPROVAL_SUBMITTED", "APPROVAL_REQUEST", saved.getId().toString(),
                "Submitted approval request " + operationType + " for amount " + amount, "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<ApprovalRequestDto> getPendingApprovals(Long branchId, String requiredRole, String riskLevel, Pageable pageable) {
        Page<ApprovalRequest> page;
        if (requiredRole != null || riskLevel != null) {
            page = approvalRequestRepository.searchPendingRequests("PENDING", requiredRole, riskLevel, pageable);
        } else if (branchId != null) {
            page = approvalRequestRepository.findByBranchIdAndStatus(branchId, "PENDING", pageable);
        } else {
            page = approvalRequestRepository.findByStatus("PENDING", pageable);
        }
        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public Page<ApprovalRequestDto> getApprovalHistory(Pageable pageable) {
        return approvalRequestRepository.findApprovalHistory(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ApprovalQueueSummaryDto getQueueSummary() {
        long pending = approvalRequestRepository.countByStatus("PENDING");
        long approved = approvalRequestRepository.countByStatus("APPROVED");
        long rejected = approvalRequestRepository.countByStatus("REJECTED");
        long expired = approvalRequestRepository.countByStatus("EXPIRED");
        long escalated = approvalRequestRepository.countByIsEscalatedTrueAndStatus("PENDING");
        long total = pending + approved + rejected + expired;

        return ApprovalQueueSummaryDto.builder()
                .pendingCount(pending)
                .approvedCount(approved)
                .rejectedCount(rejected)
                .escalatedCount(escalated)
                .expiredCount(expired)
                .totalProcessed(total)
                .build();
    }

    @Transactional
    public ApprovalRequestDto processDecision(Long requestId, ApprovalDecisionRequest request, User checkerUser) {
        ApprovalRequest approval = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", "id", requestId));

        if (!"PENDING".equalsIgnoreCase(approval.getStatus())) {
            throw new BankingException("Request has already been processed with status: " + approval.getStatus());
        }

        // SLA Expiry verification
        if (approval.getExpiresAt() != null && LocalDateTime.now().isAfter(approval.getExpiresAt())) {
            approval.setStatus("EXPIRED");
            approvalRequestRepository.save(approval);
            recordAuditLog(approval.getId(), "EXPIRED", "SYSTEM", "SYSTEM",
                    "Request expired past SLA deadline (" + approval.getExpiresAt() + ") before checker action.");
            throw new BankingException("Approval request has expired past its SLA deadline (" + approval.getExpiresAt() + ").");
        }

        // Strict Maker-Checker segregation of duties enforcement
        if (approval.getMaker().getId().equals(checkerUser.getId())) {
            throw new BankingException("Dual-authorization violation: Initiator (Maker) cannot approve their own financial request.");
        }

        // Checker role authority verification
        if (!hasRequiredOrSuperiorRole(checkerUser, approval.getRequiredRole())) {
            throw new BankingException("Insufficient authorization authority: Required checker role is " +
                    approval.getRequiredRole() + ", but user possesses lower clearance.");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(request.getDecision());

        if (!isApproved) {
            String rejectionReason = request.getRejectionReason() != null && !request.getRejectionReason().trim().isEmpty() ?
                    request.getRejectionReason().trim() : request.getCheckerRemarks();
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new BankingException("A mandatory rejection reason is required to reject an approval request.");
            }
            approval.setStatus("REJECTED");
            approval.setRejectionReason(rejectionReason);
            approval.setCheckerRemarks(request.getCheckerRemarks());
        } else {
            approval.setStatus("APPROVED");
            approval.setCheckerRemarks(request.getCheckerRemarks());
        }

        approval.setChecker(checkerUser);
        approval.setDecidedAt(LocalDateTime.now());
        ApprovalRequest saved = approvalRequestRepository.save(approval);

        // Target Entity Execution for HIGH_VALUE_TRANSFER
        if ("HIGH_VALUE_TRANSFER".equalsIgnoreCase(approval.getRequestType()) && approval.getTargetEntityId() != null) {
            Transaction txn = transactionRepository.findById(approval.getTargetEntityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", approval.getTargetEntityId()));

            if (isApproved) {
                BankAccount source = txn.getSourceAccount();
                BankAccount destination = txn.getDestinationAccount();
                BigDecimal amount = txn.getAmount();

                if (source.getAvailableBalance().compareTo(amount) < 0) {
                    throw new BankingException("Cannot execute approved transfer: Source account has insufficient balance.");
                }

                source.setBalance(source.getBalance().subtract(amount));
                source.setAvailableBalance(source.getAvailableBalance().subtract(amount));
                bankAccountRepository.save(source);

                destination.setBalance(destination.getBalance().add(amount));
                destination.setAvailableBalance(destination.getAvailableBalance().add(amount));
                bankAccountRepository.save(destination);

                txn.setStatus(TransactionStatus.SUCCESS);
                transactionRepository.save(txn);

                // Record double-entry account ledgers
                TransactionLedgerEntry debitEntry = TransactionLedgerEntry.builder()
                        .transaction(txn)
                        .account(source)
                        .entryType("DEBIT")
                        .amount(amount)
                        .runningBalance(source.getBalance())
                        .entryTimestamp(LocalDateTime.now())
                        .build();
                ledgerEntryRepository.save(debitEntry);

                TransactionLedgerEntry creditEntry = TransactionLedgerEntry.builder()
                        .transaction(txn)
                        .account(destination)
                        .entryType("CREDIT")
                        .amount(amount)
                        .runningBalance(destination.getBalance())
                        .entryTimestamp(LocalDateTime.now())
                        .build();
                ledgerEntryRepository.save(creditEntry);

                // Core Double-Entry General Ledger Posting (DR 2010 / CR 2010)
                accountingEngineService.postTransactionAccountingEntry(
                        txn.getReferenceNumber(), "INTERNAL_TRANSFER", amount, source.getBranch(), checkerUser,
                        "Approved High-Value Transfer to " + destination.getAccountNumber()
                );

            } else {
                txn.setStatus(TransactionStatus.FAILED);
                txn.setFailureReason("Rejected by Checker: " + (approval.getRejectionReason() != null ? approval.getRejectionReason() : request.getCheckerRemarks()));
                transactionRepository.save(txn);
            }
        }

        // Target Entity Execution for ACCOUNT_FREEZE
        if ("ACCOUNT_FREEZE".equalsIgnoreCase(approval.getRequestType()) && approval.getTargetEntityId() != null) {
            bankAccountRepository.findById(approval.getTargetEntityId()).ifPresent(acc -> {
                if (isApproved) {
                    acc.setStatus("FROZEN");
                }
                bankAccountRepository.save(acc);
            });
        }

        // Record Audit Log
        String checkerRole = checkerUser.getRoles().isEmpty() ? "CHECKER" : checkerUser.getRoles().iterator().next().getName().name();
        recordAuditLog(saved.getId(), isApproved ? "APPROVED" : "REJECTED", checkerUser.getUsername(),
                checkerRole, isApproved ?
                        "Request approved. Remarks: " + request.getCheckerRemarks() :
                        "Request rejected. Reason: " + approval.getRejectionReason());

        auditService.recordAudit(checkerUser, "MAKER_CHECKER_DECISION", "APPROVAL", requestId.toString(),
                "Decision " + (isApproved ? "APPROVED" : "REJECTED") + " for request " + approval.getRequestType() + " remarks: " + request.getCheckerRemarks(),
                "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    @Transactional
    public ApprovalRequestDto escalatePendingRequest(Long requestId, String reason, User caller) {
        ApprovalRequest approval = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", "id", requestId));

        if (!"PENDING".equalsIgnoreCase(approval.getStatus())) {
            throw new BankingException("Only pending requests can be escalated.");
        }

        // Determine escalation target role
        String targetRole = "REGIONAL_MANAGER";
        if ("BRANCH_MANAGER".equalsIgnoreCase(approval.getRequiredRole())) {
            targetRole = "REGIONAL_MANAGER";
        } else if ("REGIONAL_MANAGER".equalsIgnoreCase(approval.getRequiredRole())) {
            targetRole = "HEAD_OFFICE_ADMIN";
        } else if ("HEAD_OFFICE_ADMIN".equalsIgnoreCase(approval.getRequiredRole())) {
            targetRole = "SUPER_ADMIN";
        }

        approval.setIsEscalated(true);
        approval.setEscalatedAt(LocalDateTime.now());
        approval.setEscalatedToRole(targetRole);
        approval.setRequiredRole(targetRole);

        ApprovalRequest saved = approvalRequestRepository.save(approval);

        recordAuditLog(saved.getId(), "ESCALATED", caller.getUsername(),
                caller.getRoles().isEmpty() ? "USER" : caller.getRoles().iterator().next().getName().name(),
                "Request escalated to " + targetRole + ". Reason: " + reason);

        return mapToDto(saved);
    }

    @Transactional
    public int sweepExpiredRequests() {
        LocalDateTime now = LocalDateTime.now();
        List<ApprovalRequest> expiredRequests = approvalRequestRepository.findExpiredPendingRequests(now);

        for (ApprovalRequest req : expiredRequests) {
            req.setStatus("EXPIRED");
            approvalRequestRepository.save(req);

            if ("HIGH_VALUE_TRANSFER".equalsIgnoreCase(req.getRequestType()) && req.getTargetEntityId() != null) {
                transactionRepository.findById(req.getTargetEntityId()).ifPresent(txn -> {
                    txn.setStatus(TransactionStatus.FAILED);
                    txn.setFailureReason("Approval SLA expired before checker sign-off");
                    transactionRepository.save(txn);
                });
            }

            recordAuditLog(req.getId(), "EXPIRED", "SYSTEM_SLA_SWEEP", "SYSTEM",
                    "Automated SLA sweep expired pending request past deadline (" + req.getExpiresAt() + ")");
        }

        log.info("SLA Sweep expired {} overdue approval requests.", expiredRequests.size());
        return expiredRequests.size();
    }

    @Transactional(readOnly = true)
    public List<ApprovalAuditLogDto> getAuditLogsForRequest(Long requestId) {
        return auditLogRepository.findByApprovalRequestIdOrderByRecordedAtDesc(requestId).stream()
                .map(this::mapAuditToDto)
                .collect(Collectors.toList());
    }

    private void recordAuditLog(Long requestId, String action, String username, String role, String notes) {
        ApprovalAuditLog log = ApprovalAuditLog.builder()
                .approvalRequestId(requestId)
                .action(action)
                .performedByUsername(username)
                .performedByRole(role)
                .notes(notes)
                .recordedAt(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    private boolean hasRequiredOrSuperiorRole(User user, String requiredRole) {
        if (user == null || user.getRoles() == null) return false;
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        if (roleNames.contains("SUPER_ADMIN")) return true;
        if (requiredRole == null || requiredRole.trim().isEmpty()) return true;

        if ("SUPER_ADMIN".equalsIgnoreCase(requiredRole)) {
            return roleNames.contains("SUPER_ADMIN");
        }
        if ("HEAD_OFFICE_ADMIN".equalsIgnoreCase(requiredRole)) {
            return roleNames.contains("HEAD_OFFICE_ADMIN") || roleNames.contains("SUPER_ADMIN");
        }
        if ("REGIONAL_MANAGER".equalsIgnoreCase(requiredRole)) {
            return roleNames.contains("REGIONAL_MANAGER") || roleNames.contains("HEAD_OFFICE_ADMIN") || roleNames.contains("SUPER_ADMIN");
        }
        if ("BRANCH_MANAGER".equalsIgnoreCase(requiredRole)) {
            return roleNames.contains("BRANCH_MANAGER") || roleNames.contains("REGIONAL_MANAGER") ||
                   roleNames.contains("HEAD_OFFICE_ADMIN") || roleNames.contains("SUPER_ADMIN");
        }

        return roleNames.contains(requiredRole);
    }

    public ApprovalRequestDto mapToDto(ApprovalRequest a) {
        boolean isOverdue = "PENDING".equalsIgnoreCase(a.getStatus()) &&
                a.getExpiresAt() != null && LocalDateTime.now().isAfter(a.getExpiresAt());

        return ApprovalRequestDto.builder()
                .id(a.getId())
                .requestType(a.getRequestType())
                .ruleCode(a.getRuleCode())
                .requiredRole(a.getRequiredRole())
                .riskLevel(a.getRiskLevel())
                .targetEntityName(a.getTargetEntityName())
                .targetEntityId(a.getTargetEntityId())
                .makerId(a.getMaker().getId())
                .makerName(a.getMaker().getFullName())
                .makerRole(a.getMaker().getRoles().isEmpty() ? "N/A" : a.getMaker().getRoles().iterator().next().getName().name())
                .checkerId(a.getChecker() != null ? a.getChecker().getId() : null)
                .checkerName(a.getChecker() != null ? a.getChecker().getFullName() : null)
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchName(a.getBranch() != null ? a.getBranch().getName() : "Head Office")
                .amount(a.getAmount())
                .payloadJson(a.getPayloadJson())
                .status(a.getStatus())
                .makerRemarks(a.getMakerRemarks())
                .checkerRemarks(a.getCheckerRemarks())
                .rejectionReason(a.getRejectionReason())
                .isEscalated(a.getIsEscalated())
                .escalatedAt(a.getEscalatedAt())
                .escalatedToRole(a.getEscalatedToRole())
                .delegatedToUsername(a.getDelegatedToUsername())
                .requestedAt(a.getRequestedAt())
                .expiresAt(a.getExpiresAt())
                .decidedAt(a.getDecidedAt())
                .isOverdue(isOverdue)
                .build();
    }

    public ApprovalMatrixRuleDto mapRuleToDto(ApprovalMatrixRule r) {
        return ApprovalMatrixRuleDto.builder()
                .id(r.getId())
                .ruleCode(r.getRuleCode())
                .ruleName(r.getRuleName())
                .operationType(r.getOperationType())
                .minAmount(r.getMinAmount())
                .maxAmount(r.getMaxAmount())
                .requiredCheckerRole(r.getRequiredCheckerRole())
                .riskCategory(r.getRiskCategory())
                .expiryHours(r.getExpiryHours())
                .isSelfApprovalAllowed(r.getIsSelfApprovalAllowed())
                .autoEscalateAfterHours(r.getAutoEscalateAfterHours())
                .escalateToRole(r.getEscalateToRole())
                .description(r.getDescription())
                .isActive(r.getIsActive())
                .build();
    }

    public ApprovalAuditLogDto mapAuditToDto(ApprovalAuditLog l) {
        return ApprovalAuditLogDto.builder()
                .id(l.getId())
                .approvalRequestId(l.getApprovalRequestId())
                .action(l.getAction())
                .performedByUsername(l.getPerformedByUsername())
                .performedByRole(l.getPerformedByRole())
                .notes(l.getNotes())
                .recordedAt(l.getRecordedAt())
                .build();
    }
}
