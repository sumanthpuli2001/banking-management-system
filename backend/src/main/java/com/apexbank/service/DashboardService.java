package com.apexbank.service;

import com.apexbank.dto.dashboard.HeadOfficeDashboardDto;
import com.apexbank.entity.AuditLog;
import com.apexbank.entity.Branch;
import com.apexbank.repository.AuditLogRepository;
import com.apexbank.repository.BranchRepository;
import com.apexbank.repository.RegionRepository;
import com.apexbank.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final BranchRepository branchRepository;
    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardService(BranchRepository branchRepository,
                            RegionRepository regionRepository,
                            UserRepository userRepository,
                            AuditLogRepository auditLogRepository) {
        this.branchRepository = branchRepository;
        this.regionRepository = regionRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public HeadOfficeDashboardDto getHeadOfficeSummary() {
        long branchCount = branchRepository.count();
        long regionCount = regionRepository.count();
        long userCount = userRepository.count();

        // Representative consolidated enterprise metrics
        BigDecimal totalDeposits = new BigDecimal("1845200000.00"); // 1.845 Billion INR
        BigDecimal totalAdvances = new BigDecimal("1210400000.00"); // 1.210 Billion INR
        BigDecimal todayDeposits = new BigDecimal("42600000.00");   // 42.6 Million INR
        BigDecimal todayWithdrawals = new BigDecimal("28150000.00"); // 28.15 Million INR
        BigDecimal netClearing = todayDeposits.subtract(todayWithdrawals);
        BigDecimal liquidityRatio = new BigDecimal("24.8"); // 24.8%

        long activeCustomers = 14820;
        long activeAccounts = 19450;
        long todayTxnCount = 1840;

        long pendingLoans = 14;
        long pendingTransfers = 8;
        long pendingAccounts = 22;
        long suspiciousAlerts = 3;

        // Populate realistic branch performance
        List<Branch> branches = branchRepository.findAll();
        List<HeadOfficeDashboardDto.BranchPerformanceDto> branchPerformanceList = new ArrayList<>();

        BigDecimal[] mockDeposits = {
                new BigDecimal("620000000.00"),
                new BigDecimal("410000000.00"),
                new BigDecimal("350000000.00"),
                new BigDecimal("280000000.00"),
                new BigDecimal("185200000.00")
        };
        BigDecimal[] mockAdvances = {
                new BigDecimal("430000000.00"),
                new BigDecimal("290000000.00"),
                new BigDecimal("240000000.00"),
                new BigDecimal("150000000.00"),
                new BigDecimal("100400000.00")
        };
        long[] mockAccounts = { 5800, 4200, 3900, 3100, 2450 };
        double[] mockScores = { 98.4, 96.8, 97.2, 94.5, 95.1 };

        int idx = 0;
        for (Branch b : branches) {
            int i = idx % mockDeposits.length;
            branchPerformanceList.add(HeadOfficeDashboardDto.BranchPerformanceDto.builder()
                    .branchId(b.getId())
                    .branchCode(b.getBranchCode())
                    .branchName(b.getName())
                    .region(b.getRegion() != null ? b.getRegion().getName() : "Central Corporate")
                    .totalDeposits(mockDeposits[i])
                    .totalAdvances(mockAdvances[i])
                    .activeAccounts(mockAccounts[i])
                    .status(b.getStatus())
                    .complianceScore(mockScores[i])
                    .build());
            idx++;
        }

        // Monthly trends
        List<HeadOfficeDashboardDto.MonthlyTrendDto> monthlyTrends = List.of(
                new HeadOfficeDashboardDto.MonthlyTrendDto("Jun", new BigDecimal("1540"), new BigDecimal("1020"), new BigDecimal("48.2")),
                new HeadOfficeDashboardDto.MonthlyTrendDto("Jul", new BigDecimal("1610"), new BigDecimal("1070"), new BigDecimal("51.6")),
                new HeadOfficeDashboardDto.MonthlyTrendDto("Aug", new BigDecimal("1680"), new BigDecimal("1110"), new BigDecimal("54.1")),
                new HeadOfficeDashboardDto.MonthlyTrendDto("Sep", new BigDecimal("1720"), new BigDecimal("1150"), new BigDecimal("56.8")),
                new HeadOfficeDashboardDto.MonthlyTrendDto("Oct", new BigDecimal("1790"), new BigDecimal("1180"), new BigDecimal("59.4")),
                new HeadOfficeDashboardDto.MonthlyTrendDto("Nov", new BigDecimal("1845"), new BigDecimal("1210"), new BigDecimal("62.1"))
        );

        // Transaction volume by time slots
        List<HeadOfficeDashboardDto.TransactionVolumeDto> timeSlotVolumes = List.of(
                new HeadOfficeDashboardDto.TransactionVolumeDto("09:00 - 11:00", 380, new BigDecimal("8.4")),
                new HeadOfficeDashboardDto.TransactionVolumeDto("11:00 - 13:00", 620, new BigDecimal("16.8")),
                new HeadOfficeDashboardDto.TransactionVolumeDto("13:00 - 15:00", 410, new BigDecimal("9.2")),
                new HeadOfficeDashboardDto.TransactionVolumeDto("15:00 - 17:00", 430, new BigDecimal("8.2"))
        );

        // Recent banking activities from audit logs
        List<AuditLog> auditLogs = auditLogRepository.findTop20ByOrderByEventTimestampDesc();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        List<HeadOfficeDashboardDto.RecentActivityDto> recentActivities = new ArrayList<>();
        for (AuditLog al : auditLogs) {
            recentActivities.add(HeadOfficeDashboardDto.RecentActivityDto.builder()
                    .id(al.getId())
                    .timestamp(al.getEventTimestamp().format(dtf))
                    .branchName(al.getBranchName())
                    .userRole(al.getUserRole())
                    .username(al.getUsername())
                    .action(al.getAction())
                    .referenceId(al.getReferenceId())
                    .status(al.getStatus())
                    .build());
        }

        return HeadOfficeDashboardDto.builder()
                .totalBankDeposits(totalDeposits)
                .totalBankAdvances(totalAdvances)
                .todayDeposits(todayDeposits)
                .todayWithdrawals(todayWithdrawals)
                .netDailyClearing(netClearing)
                .reserveLiquidityRatio(liquidityRatio)
                .totalBranches(branchCount)
                .totalRegionalOffices(regionCount)
                .totalActiveCustomers(activeCustomers)
                .totalActiveAccounts(activeAccounts)
                .totalEmployees(userCount)
                .todayTransactionsCount(todayTxnCount)
                .pendingLoanApprovals(pendingLoans)
                .pendingFundTransferApprovals(pendingTransfers)
                .pendingAccountApprovals(pendingAccounts)
                .suspiciousTransactionAlerts(suspiciousAlerts)
                .branchPerformance(branchPerformanceList)
                .monthlyFinancialTrends(monthlyTrends)
                .transactionVolumeAnalytics(timeSlotVolumes)
                .recentBankingActivities(recentActivities)
                .build();
    }
}
