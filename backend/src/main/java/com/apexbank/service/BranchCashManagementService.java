package com.apexbank.service;

import com.apexbank.dto.branchcash.*;
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
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BranchCashManagementService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final TellerCashDrawerRepository drawerRepository;
    private final TellerHandoverRepository handoverRepository;
    private final CashShortageExcessRepository shortageExcessRepository;
    private final InterBranchCashTransferRepository interBranchTransferRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    public BranchCashManagementService(BranchRepository branchRepository,
                                       UserRepository userRepository,
                                       TellerCashDrawerRepository drawerRepository,
                                       TellerHandoverRepository handoverRepository,
                                       CashShortageExcessRepository shortageExcessRepository,
                                       InterBranchCashTransferRepository interBranchTransferRepository,
                                       AccountingEngineService accountingEngineService,
                                       AuditService auditService) {
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.drawerRepository = drawerRepository;
        this.handoverRepository = handoverRepository;
        this.shortageExcessRepository = shortageExcessRepository;
        this.interBranchTransferRepository = interBranchTransferRepository;
        this.accountingEngineService = accountingEngineService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<BranchCashPositionDto> getAllBranchCashPositions() {
        return branchRepository.findAll().stream()
                .map(this::computeBranchCashPosition)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchCashPositionDto getBranchCashPosition(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));
        return computeBranchCashPosition(branch);
    }

    private BranchCashPositionDto computeBranchCashPosition(Branch branch) {
        List<TellerCashDrawer> activeDrawers = drawerRepository.findByBranchIdAndStatus(branch.getId(), "OPEN");

        BigDecimal totalDrawersCash = activeDrawers.stream()
                .map(TellerCashDrawer::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal vaultBalance = branch.getCashVaultBalance() != null ? branch.getCashVaultBalance() : BigDecimal.ZERO;
        BigDecimal totalBranchCash = vaultBalance.add(totalDrawersCash);

        BigDecimal todayReceipts = activeDrawers.stream()
                .map(TellerCashDrawer::getCashReceipts)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayPayments = activeDrawers.stream()
                .map(TellerCashDrawer::getCashPayments)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InterBranchCashTransfer> inTransit = interBranchTransferRepository.findByStatus("DISPATCHED_IN_TRANSIT");

        BigDecimal inTransitIncoming = inTransit.stream()
                .filter(t -> t.getDestinationBranch().getId().equals(branch.getId()))
                .map(InterBranchCashTransfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal inTransitOutgoing = inTransit.stream()
                .filter(t -> t.getSourceBranch().getId().equals(branch.getId()))
                .map(InterBranchCashTransfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BranchCashPositionDto.builder()
                .branchId(branch.getId())
                .branchCode(branch.getBranchCode())
                .branchName(branch.getName())
                .vaultCashBalance(vaultBalance)
                .activeDrawersCount(activeDrawers.size())
                .totalDrawersCashBalance(totalDrawersCash)
                .totalBranchCash(totalBranchCash)
                .todayReceipts(todayReceipts)
                .todayPayments(todayPayments)
                .netIntradayMovement(todayReceipts.subtract(todayPayments))
                .inTransitIncoming(inTransitIncoming)
                .inTransitOutgoing(inTransitOutgoing)
                .build();
    }

    @Transactional
    public TellerCashDrawerDto openTellerDrawer(OpenDrawerRequest request, User authorizerUser) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getBranchId()));

        User cashier = userRepository.findById(request.getCashierUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getCashierUserId()));

        Optional<TellerCashDrawer> existingOpen = drawerRepository.findByAssignedCashierIdAndStatus(cashier.getId(), "OPEN");
        if (existingOpen.isPresent()) {
            return mapDrawerToDto(existingOpen.get());
        }

        BigDecimal initialCash = request.getInitialVaultCashAmount() != null ? request.getInitialVaultCashAmount() : BigDecimal.ZERO;

        if (initialCash.compareTo(BigDecimal.ZERO) > 0) {
            if (branch.getCashVaultBalance().compareTo(initialCash) < 0) {
                throw new BankingException("Insufficient cash vault balance. Available: INR " + branch.getCashVaultBalance());
            }
            branch.setCashVaultBalance(branch.getCashVaultBalance().subtract(initialCash));
            branchRepository.save(branch);
        }

        TellerCashDrawer drawer = TellerCashDrawer.builder()
                .drawerCode(request.getDrawerCode())
                .branch(branch)
                .assignedCashier(cashier)
                .status("OPEN")
                .openingBalance(initialCash)
                .cashReceipts(BigDecimal.ZERO)
                .cashPayments(BigDecimal.ZERO)
                .currentBalance(initialCash)
                .openedAt(LocalDateTime.now())
                .build();

        TellerCashDrawer saved = drawerRepository.save(drawer);

        auditService.recordAudit(authorizerUser, "TELLER_DRAWER_OPENED", "CASH_DRAWER", saved.getDrawerCode(),
                "Teller drawer opened for cashier " + cashier.getUsername() + " with initial vault cash INR " + initialCash, "127.0.0.1", "SUCCESS");

        return mapDrawerToDto(saved);
    }

    @Transactional(readOnly = true)
    public TellerCashDrawerDto getCashierDrawer(Long cashierUserId) {
        TellerCashDrawer drawer = drawerRepository.findByAssignedCashierIdAndStatus(cashierUserId, "OPEN")
                .orElse(null);
        return drawer != null ? mapDrawerToDto(drawer) : null;
    }

    @Transactional(readOnly = true)
    public List<TellerCashDrawerDto> getDrawersByBranch(Long branchId) {
        return drawerRepository.findByBranchId(branchId).stream()
                .map(this::mapDrawerToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void recordTellerCashTransaction(User cashierUser, BigDecimal amount, boolean isDeposit) {
        if (cashierUser == null) return;
        Optional<TellerCashDrawer> drawerOpt = drawerRepository.findByAssignedCashierIdAndStatus(cashierUser.getId(), "OPEN");
        if (drawerOpt.isPresent()) {
            TellerCashDrawer drawer = drawerOpt.get();
            if (isDeposit) {
                drawer.addReceipt(amount);
            } else {
                drawer.addPayment(amount);
            }
            drawerRepository.save(drawer);
        }
    }

    @Transactional
    public CashShortageExcessDto executeTellerHandover(TellerHandoverRequest request, User sourceTeller) {
        TellerCashDrawer drawer = drawerRepository.findById(request.getDrawerId())
                .orElseThrow(() -> new ResourceNotFoundException("TellerCashDrawer", "id", request.getDrawerId()));

        BigDecimal systemExpected = drawer.getCurrentBalance();
        BigDecimal physicalCount = request.getPhysicalCountAmount();
        BigDecimal diff = physicalCount.subtract(systemExpected);

        CashShortageExcessRecord variance = null;
        if (diff.compareTo(BigDecimal.ZERO) != 0) {
            String incidentType = diff.compareTo(BigDecimal.ZERO) < 0 ? "SHORTAGE" : "EXCESS";
            variance = CashShortageExcessRecord.builder()
                    .incidentNumber("CSH-VAR-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100))
                    .branch(drawer.getBranch())
                    .drawer(drawer)
                    .cashier(sourceTeller)
                    .incidentType(incidentType)
                    .expectedAmount(systemExpected)
                    .physicalAmount(physicalCount)
                    .varianceAmount(diff.abs())
                    .status("REPORTED")
                    .investigationNotes("Automatic variance logged during teller drawer closing/handover. Expected: " + systemExpected + ", Physical: " + physicalCount)
                    .reportedAt(LocalDateTime.now())
                    .build();
            variance = shortageExcessRepository.save(variance);
        }

        if (Boolean.TRUE.equals(request.getIsVaultReturn())) {
            Branch branch = drawer.getBranch();
            branch.setCashVaultBalance(branch.getCashVaultBalance().add(physicalCount));
            branchRepository.save(branch);

            drawer.setStatus("CLOSED");
            drawer.setClosedAt(LocalDateTime.now());
            drawerRepository.save(drawer);
        } else if (request.getDestinationTellerId() != null) {
            User destTeller = userRepository.findById(request.getDestinationTellerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getDestinationTellerId()));
            drawer.setAssignedCashier(destTeller);
            drawer.setOpeningBalance(physicalCount);
            drawer.setCashReceipts(BigDecimal.ZERO);
            drawer.setCashPayments(BigDecimal.ZERO);
            drawer.setCurrentBalance(physicalCount);
            drawerRepository.save(drawer);
        }

        TellerHandover handover = TellerHandover.builder()
                .handoverNumber("HND-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 9000 + 1000))
                .drawer(drawer)
                .sourceTeller(sourceTeller)
                .destinationTeller(request.getDestinationTellerId() != null ? userRepository.findById(request.getDestinationTellerId()).orElse(null) : null)
                .isVaultReturn(request.getIsVaultReturn())
                .systemExpectedAmount(systemExpected)
                .physicalCountAmount(physicalCount)
                .discrepancyAmount(diff)
                .status(diff.compareTo(BigDecimal.ZERO) == 0 ? "ACCEPTED" : "FLAGGED_DISCREPANCY")
                .handoverRemarks(request.getHandoverRemarks())
                .authorizedBy(sourceTeller)
                .handoverTimestamp(LocalDateTime.now())
                .build();
        handoverRepository.save(handover);

        auditService.recordAudit(sourceTeller, "TELLER_HANDOVER_EXECUTED", "CASH_DRAWER", drawer.getDrawerCode(),
                "Handover completed. Expected: " + systemExpected + ", Physical: " + physicalCount + ", Discrepancy: " + diff, "127.0.0.1", "SUCCESS");

        return variance != null ? mapVarianceToDto(variance) : null;
    }

    @Transactional
    public InterBranchTransferDto initiateInterBranchTransfer(InterBranchTransferRequest request, User dispatchingOfficer) {
        Branch source = branchRepository.findById(request.getSourceBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getSourceBranchId()));

        Branch destination = branchRepository.findById(request.getDestinationBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", request.getDestinationBranchId()));

        if (source.getId().equals(destination.getId())) {
            throw new BankingException("Source and destination branch nodes must be distinct for inter-branch cash transit.");
        }

        BigDecimal amount = request.getAmount();
        if (source.getCashVaultBalance().compareTo(amount) < 0) {
            throw new BankingException("Source branch vault liquidity insufficient. Available: INR " + source.getCashVaultBalance());
        }

        source.setCashVaultBalance(source.getCashVaultBalance().subtract(amount));
        branchRepository.save(source);

        String transferNum = "IBCT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 9000 + 1000);

        InterBranchCashTransfer transfer = InterBranchCashTransfer.builder()
                .transferNumber(transferNum)
                .sourceBranch(source)
                .destinationBranch(destination)
                .amount(amount)
                .status("DISPATCHED_IN_TRANSIT")
                .transitCarrier(request.getTransitCarrier() != null ? request.getTransitCarrier() : "Secure Armored Logistics Ltd")
                .securitySealNumber(request.getSecuritySealNumber() != null ? request.getSecuritySealNumber() : "SEAL-" + (int)(Math.random() * 900000 + 100000))
                .dispatchingOfficer(dispatchingOfficer)
                .dispatchRemarks(request.getDispatchRemarks() != null ? request.getDispatchRemarks() : "Cash vault transit dispatched under dual-custody seal")
                .dispatchedAt(LocalDateTime.now())
                .build();
        InterBranchCashTransfer saved = interBranchTransferRepository.save(transfer);

        // Due-From Double-Entry Accounting Entry:
        // DR 1030-INTER-BRANCH-CLEARING (Due From Destination Branch)
        // CR 1010-CASH-VAULT (Source Branch Vault Cash Payout)
        accountingEngineService.postTransactionAccountingEntry(
                transferNum, "INTER_BRANCH_CLEARING_DISPATCH", amount, source, dispatchingOfficer,
                "Inter-Branch Cash Transit Dispatch to " + destination.getName()
        );

        auditService.recordAudit(dispatchingOfficer, "INTER_BRANCH_CASH_DISPATCHED", "VAULT_TRANSIT", transferNum,
                "Cash transit dispatched: INR " + amount + " from " + source.getName() + " to " + destination.getName(), "127.0.0.1", "SUCCESS");

        return mapTransferToDto(saved);
    }

    @Transactional
    public InterBranchTransferDto receiveAndSettleInterBranchTransfer(Long transferId, String receiptRemarks, User receivingOfficer) {
        InterBranchCashTransfer transfer = interBranchTransferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("InterBranchCashTransfer", "id", transferId));

        if (!"DISPATCHED_IN_TRANSIT".equals(transfer.getStatus())) {
            throw new BankingException("Transfer is currently " + transfer.getStatus() + ". Only transit shipments can be settled.");
        }

        Branch destination = transfer.getDestinationBranch();
        destination.setCashVaultBalance(destination.getCashVaultBalance().add(transfer.getAmount()));
        branchRepository.save(destination);

        transfer.setStatus("RECEIVED_SETTLED");
        transfer.setReceivingOfficer(receivingOfficer);
        transfer.setReceiptRemarks(receiptRemarks != null ? receiptRemarks : "Armored carrier verified. Security seals inspected and vault cash safely deposited.");
        transfer.setReceivedAt(LocalDateTime.now());
        InterBranchCashTransfer saved = interBranchTransferRepository.save(transfer);

        // Due-To Settlement Double-Entry Accounting Entry:
        // DR 1010-CASH-VAULT (Destination Branch Vault Cash Receipt)
        // CR 1030-INTER-BRANCH-CLEARING (Due to Source Branch Cleared)
        accountingEngineService.postTransactionAccountingEntry(
                transfer.getTransferNumber(), "INTER_BRANCH_CLEARING_SETTLEMENT", transfer.getAmount(), destination, receivingOfficer,
                "Inter-Branch Cash Transit Receipt from " + transfer.getSourceBranch().getName()
        );

        auditService.recordAudit(receivingOfficer, "INTER_BRANCH_CASH_SETTLED", "VAULT_TRANSIT", transfer.getTransferNumber(),
                "Cash transit received and settled into vault: INR " + transfer.getAmount() + " at " + destination.getName(), "127.0.0.1", "SUCCESS");

        return mapTransferToDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<InterBranchTransferDto> getInterBranchTransfers(Pageable pageable) {
        return interBranchTransferRepository.findAllByOrderByDispatchedAtDesc(pageable).map(this::mapTransferToDto);
    }

    @Transactional(readOnly = true)
    public Page<CashShortageExcessDto> getVariances(String status, Pageable pageable) {
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            return shortageExcessRepository.findByStatusOrderByReportedAtDesc(status, pageable).map(this::mapVarianceToDto);
        }
        return shortageExcessRepository.findAllByOrderByReportedAtDesc(pageable).map(this::mapVarianceToDto);
    }

    @Transactional
    public CashShortageExcessDto resolveVariance(Long id, String notes, User resolver) {
        CashShortageExcessRecord rec = shortageExcessRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CashShortageExcessRecord", "id", id));
        rec.setStatus("RESOLVED");
        rec.setInvestigationNotes(notes);
        rec.setResolvedBy(resolver);
        rec.setResolvedAt(LocalDateTime.now());
        CashShortageExcessRecord saved = shortageExcessRepository.save(rec);

        auditService.recordAudit(resolver, "CASH_VARIANCE_RESOLVED", "CASH_DRAWER", rec.getIncidentNumber(),
                "Variance resolved: " + notes, "127.0.0.1", "SUCCESS");

        return mapVarianceToDto(saved);
    }

    public TellerCashDrawerDto mapDrawerToDto(TellerCashDrawer d) {
        return TellerCashDrawerDto.builder()
                .id(d.getId())
                .drawerCode(d.getDrawerCode())
                .branchId(d.getBranch().getId())
                .branchName(d.getBranch().getName())
                .cashierUserId(d.getAssignedCashier() != null ? d.getAssignedCashier().getId() : null)
                .cashierUsername(d.getAssignedCashier() != null ? d.getAssignedCashier().getUsername() : "UNASSIGNED")
                .cashierFullName(d.getAssignedCashier() != null ? d.getAssignedCashier().getFullName() : "Unassigned")
                .status(d.getStatus())
                .openingBalance(d.getOpeningBalance())
                .cashReceipts(d.getCashReceipts())
                .cashPayments(d.getCashPayments())
                .currentBalance(d.getCurrentBalance())
                .openedAt(d.getOpenedAt())
                .closedAt(d.getClosedAt())
                .build();
    }

    public InterBranchTransferDto mapTransferToDto(InterBranchCashTransfer t) {
        return InterBranchTransferDto.builder()
                .id(t.getId())
                .transferNumber(t.getTransferNumber())
                .sourceBranchId(t.getSourceBranch().getId())
                .sourceBranchName(t.getSourceBranch().getName())
                .destinationBranchId(t.getDestinationBranch().getId())
                .destinationBranchName(t.getDestinationBranch().getName())
                .amount(t.getAmount())
                .status(t.getStatus())
                .transitCarrier(t.getTransitCarrier())
                .securitySealNumber(t.getSecuritySealNumber())
                .dispatchingOfficerUsername(t.getDispatchingOfficer() != null ? t.getDispatchingOfficer().getUsername() : "SYSTEM")
                .receivingOfficerUsername(t.getReceivingOfficer() != null ? t.getReceivingOfficer().getUsername() : null)
                .dispatchRemarks(t.getDispatchRemarks())
                .receiptRemarks(t.getReceiptRemarks())
                .dispatchedAt(t.getDispatchedAt())
                .receivedAt(t.getReceivedAt())
                .build();
    }

    public CashShortageExcessDto mapVarianceToDto(CashShortageExcessRecord v) {
        return CashShortageExcessDto.builder()
                .id(v.getId())
                .incidentNumber(v.getIncidentNumber())
                .branchId(v.getBranch().getId())
                .branchName(v.getBranch().getName())
                .drawerId(v.getDrawer() != null ? v.getDrawer().getId() : null)
                .drawerCode(v.getDrawer() != null ? v.getDrawer().getDrawerCode() : "MAIN_VAULT")
                .cashierUserId(v.getCashier().getId())
                .cashierUsername(v.getCashier().getUsername())
                .incidentType(v.getIncidentType())
                .expectedAmount(v.getExpectedAmount())
                .physicalAmount(v.getPhysicalAmount())
                .varianceAmount(v.getVarianceAmount())
                .status(v.getStatus())
                .investigationNotes(v.getInvestigationNotes())
                .resolvedByUsername(v.getResolvedBy() != null ? v.getResolvedBy().getUsername() : null)
                .reportedAt(v.getReportedAt())
                .resolvedAt(v.getResolvedAt())
                .build();
    }
}
