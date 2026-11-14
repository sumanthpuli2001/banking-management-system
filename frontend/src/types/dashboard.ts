export interface BranchPerformance {
  branchId: number;
  branchCode: string;
  branchName: string;
  region: string;
  totalDeposits: number;
  totalAdvances: number;
  activeAccounts: number;
  status: string;
  complianceScore: number;
}

export interface MonthlyTrend {
  month: string;
  deposits: number;
  advances: number;
  revenue: number;
}

export interface TransactionVolume {
  timeSlot: string;
  count: number;
  volumeAmount: number;
}

export interface RecentActivity {
  id: number;
  timestamp: string;
  branchName: string;
  userRole: string;
  username: string;
  action: string;
  referenceId: string;
  status: string;
}

export interface HeadOfficeDashboardSummary {
  totalBankDeposits: number;
  totalBankAdvances: number;
  todayDeposits: number;
  todayWithdrawals: number;
  netDailyClearing: number;
  reserveLiquidityRatio: number;
  totalBranches: number;
  totalRegionalOffices: number;
  totalActiveCustomers: number;
  totalActiveAccounts: number;
  totalEmployees: number;
  todayTransactionsCount: number;
  pendingLoanApprovals: number;
  pendingFundTransferApprovals: number;
  pendingAccountApprovals: number;
  suspiciousTransactionAlerts: number;
  branchPerformance: BranchPerformance[];
  monthlyFinancialTrends: MonthlyTrend[];
  transactionVolumeAnalytics: TransactionVolume[];
  recentBankingActivities: RecentActivity[];
}
