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
  crrPercentage?: number;
  slrPercentage?: number;
  crrCompliant?: boolean;
  slrCompliant?: boolean;
  grossNpaRatio?: number;
  totalNpaAmount?: number;
  totalTermDepositsAmount?: number;
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
  pendingMakerCheckerCount?: number;
  escalatedMakerCheckerCount?: number;
  activeAmlAlertsCount?: number;
  eodStatus?: string;
  eodLastRunDate?: string;
  branchPerformance: BranchPerformance[];
  monthlyFinancialTrends: MonthlyTrend[];
  transactionVolumeAnalytics: TransactionVolume[];
  recentBankingActivities: RecentActivity[];
}

export interface EodBatchStep {
  id: number;
  batchRunId: number;
  stepNumber: number;
  stepCode: string;
  stepName: string;
  status: string;
  durationMs: number;
  details: string;
  executedAt: string;
}

export interface EodBatchRun {
  id: number;
  batchDate: string;
  batchType: string;
  status: string;
  branchCountVerified: number;
  unbalancedEntriesCount: number;
  interestAccrualTotal: number;
  regulatoryReserveCalculated: boolean;
  initiatedBy: string;
  summaryNotes: string;
  startedAt: string;
  completedAt?: string;
  steps: EodBatchStep[];
}
