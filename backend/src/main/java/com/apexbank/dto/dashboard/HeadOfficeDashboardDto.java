package com.apexbank.dto.dashboard;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeadOfficeDashboardDto {
    // Financial Key Performance Indicators
    private BigDecimal totalBankDeposits;
    private BigDecimal totalBankAdvances;
    private BigDecimal todayDeposits;
    private BigDecimal todayWithdrawals;
    private BigDecimal netDailyClearing;
    private BigDecimal reserveLiquidityRatio;

    // Operational Counters
    private long totalBranches;
    private long totalRegionalOffices;
    private long totalActiveCustomers;
    private long totalActiveAccounts;
    private long totalEmployees;
    private long todayTransactionsCount;

    // Pending Approvals & Risk Alerts
    private long pendingLoanApprovals;
    private long pendingFundTransferApprovals;
    private long pendingAccountApprovals;
    private long suspiciousTransactionAlerts;

    // Comparative Analytics
    private List<BranchPerformanceDto> branchPerformance;
    private List<MonthlyTrendDto> monthlyFinancialTrends;
    private List<TransactionVolumeDto> transactionVolumeAnalytics;
    private List<RecentActivityDto> recentBankingActivities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BranchPerformanceDto {
        private Long branchId;
        private String branchCode;
        private String branchName;
        private String region;
        private BigDecimal totalDeposits;
        private BigDecimal totalAdvances;
        private long activeAccounts;
        private String status;
        private double complianceScore;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyTrendDto {
        private String month;
        private BigDecimal deposits;
        private BigDecimal advances;
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionVolumeDto {
        private String timeSlot;
        private long count;
        private BigDecimal volumeAmount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentActivityDto {
        private Long id;
        private String timestamp;
        private String branchName;
        private String userRole;
        private String username;
        private String action;
        private String referenceId;
        private String status;
    }
}
