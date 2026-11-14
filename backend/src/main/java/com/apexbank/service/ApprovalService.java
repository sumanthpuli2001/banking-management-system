package com.apexbank.service;

import com.apexbank.dto.approval.ApprovalDecisionRequest;
import com.apexbank.dto.approval.ApprovalRequestDto;
import com.apexbank.entity.*;
import com.apexbank.exception.BankingException;
import com.apexbank.exception.ResourceNotFoundException;
import com.apexbank.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ApprovalService {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;

    public ApprovalService(ApprovalRequestRepository approvalRequestRepository,
                           TransactionRepository transactionRepository,
                           BankAccountRepository bankAccountRepository,
                           TransactionLedgerEntryRepository ledgerEntryRepository,
                           AuditService auditService) {
        this.approvalRequestRepository = approvalRequestRepository;
        this.transactionRepository = transactionRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<ApprovalRequestDto> getPendingApprovals(Long branchId, Pageable pageable) {
        Page<ApprovalRequest> page = branchId != null ?
                approvalRequestRepository.findByBranchIdAndStatus(branchId, "PENDING", pageable) :
                approvalRequestRepository.findByStatus("PENDING", pageable);
        return page.map(this::mapToDto);
    }

    @Transactional
    public ApprovalRequestDto processDecision(Long requestId, ApprovalDecisionRequest request, User checkerUser) {
        ApprovalRequest approval = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ApprovalRequest", "id", requestId));

        if (!"PENDING".equalsIgnoreCase(approval.getStatus())) {
            throw new BankingException("Request has already been processed with status: " + approval.getStatus());
        }

        // Strict Maker-Checker segregation of duties enforcement
        if (approval.getMaker().getId().equals(checkerUser.getId())) {
            throw new BankingException("Dual-authorization violation: Initiator (Maker) cannot approve their own financial request.");
        }

        boolean isApproved = "APPROVED".equalsIgnoreCase(request.getDecision());
        approval.setStatus(isApproved ? "APPROVED" : "REJECTED");
        approval.setChecker(checkerUser);
        approval.setCheckerRemarks(request.getCheckerRemarks());
        approval.setDecidedAt(LocalDateTime.now());
        ApprovalRequest saved = approvalRequestRepository.save(approval);

        // Handle target execution if high value transfer
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

                // Record double-entry ledgers
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

            } else {
                txn.setStatus(TransactionStatus.FAILED);
                txn.setFailureReason("Rejected by Checker: " + request.getCheckerRemarks());
                transactionRepository.save(txn);
            }
        }

        auditService.recordAudit(checkerUser, "MAKER_CHECKER_DECISION", "APPROVAL", requestId.toString(),
                "Decision " + request.getDecision() + " for request " + approval.getRequestType() + " remarks: " + request.getCheckerRemarks(), "127.0.0.1", "SUCCESS");

        return mapToDto(saved);
    }

    public ApprovalRequestDto mapToDto(ApprovalRequest a) {
        return ApprovalRequestDto.builder()
                .id(a.getId())
                .requestType(a.getRequestType())
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
                .requestedAt(a.getRequestedAt())
                .decidedAt(a.getDecidedAt())
                .build();
    }
}
