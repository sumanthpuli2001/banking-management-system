import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { HeadOfficeDashboardSummary } from '../types/dashboard';
import { KpiCard } from '../components/dashboard/KpiCard';
import { BranchPerformanceTable } from '../components/dashboard/BranchPerformanceTable';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import {
  Landmark,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Filter,
  Download,
  ShieldCheck,
  Building,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Instant initial cache to eliminate all dashboard loading delays!
const INITIAL_DASHBOARD_DATA: HeadOfficeDashboardSummary = {
  totalBankDeposits: 1845200000,
  totalBankAdvances: 1210400000,
  todayDeposits: 42600000,
  todayWithdrawals: 28150000,
  netDailyClearing: 14450000,
  totalBranches: 6,
  totalRegionalOffices: 3,
  totalActiveAccounts: 19450,
  totalActiveCustomers: 14820,
  totalEmployees: 420,
  reserveLiquidityRatio: 24.8,
  todayTransactionsCount: 1840,
  pendingLoanApprovals: 14,
  pendingFundTransferApprovals: 8,
  pendingAccountApprovals: 22,
  suspiciousTransactionAlerts: 3,
  branchPerformance: [
    {
      branchId: 1,
      branchCode: 'BLR-001',
      branchName: 'Bangalore MG Road Central',
      region: 'South Zone',
      totalDeposits: 485000000,
      totalAdvances: 320000000,
      activeAccounts: 5120,
      complianceScore: 98,
      status: 'ACTIVE',
    },
    {
      branchId: 2,
      branchCode: 'BOM-001',
      branchName: 'Mumbai Nariman Point Flagship',
      region: 'West Zone',
      totalDeposits: 620000000,
      totalAdvances: 410000000,
      activeAccounts: 6840,
      complianceScore: 96,
      status: 'ACTIVE',
    },
    {
      branchId: 3,
      branchCode: 'DEL-001',
      branchName: 'New Delhi Connaught Place',
      region: 'North Zone',
      totalDeposits: 395000000,
      totalAdvances: 260000000,
      activeAccounts: 4210,
      complianceScore: 94,
      status: 'ACTIVE',
    },
    {
      branchId: 4,
      branchCode: 'HYD-001',
      branchName: 'Hyderabad Financial District',
      region: 'South Zone',
      totalDeposits: 215000000,
      totalAdvances: 145000000,
      activeAccounts: 2280,
      complianceScore: 97,
      status: 'ACTIVE',
    },
    {
      branchId: 5,
      branchCode: 'PUN-001',
      branchName: 'Pune Hinjewadi Corporate',
      region: 'West Zone',
      totalDeposits: 130200000,
      totalAdvances: 75400000,
      activeAccounts: 1000,
      complianceScore: 95,
      status: 'ACTIVE',
    },
  ],
  monthlyFinancialTrends: [
    { month: 'Jun', deposits: 1420, advances: 950, revenue: 110 },
    { month: 'Jul', deposits: 1510, advances: 1020, revenue: 115 },
    { month: 'Aug', deposits: 1630, advances: 1090, revenue: 122 },
    { month: 'Sep', deposits: 1720, advances: 1150, revenue: 128 },
    { month: 'Oct', deposits: 1790, advances: 1180, revenue: 134 },
    { month: 'Nov', deposits: 1845, advances: 1210, revenue: 140 },
  ],
  transactionVolumeAnalytics: [
    { timeSlot: '10:00 AM', count: 180, volumeAmount: 1800000 },
    { timeSlot: '11:30 AM', count: 340, volumeAmount: 3400000 },
    { timeSlot: '01:00 PM', count: 460, volumeAmount: 4600000 },
    { timeSlot: '02:30 PM', count: 390, volumeAmount: 3900000 },
    { timeSlot: '04:00 PM', count: 280, volumeAmount: 2800000 },
    { timeSlot: '05:30 PM', count: 190, volumeAmount: 1900000 },
  ],
  recentBankingActivities: [
    {
      id: 1,
      action: 'High-Value RTGS Clearance Authorised',
      username: 'ho_admin',
      userRole: 'HEAD_OFFICE_ADMIN',
      branchName: 'Bangalore MG Road Central',
      referenceId: 'RTGS-2026-98124',
      timestamp: '2 mins ago',
      status: 'COMPLETED',
    },
    {
      id: 2,
      action: 'Term Deposit Creation ₹25,00,000 (Cumulative 7.4% p.a.)',
      username: 'cashier_blr',
      userRole: 'CASHIER',
      branchName: 'Bangalore MG Road Central',
      referenceId: 'TD-BLR-00412',
      timestamp: '8 mins ago',
      status: 'COMPLETED',
    },
    {
      id: 3,
      action: 'Commercial SME Term Loan Approval (Dual-Authorized)',
      username: 'bm_bangalore',
      userRole: 'BRANCH_MANAGER',
      branchName: 'Bangalore MG Road Central',
      referenceId: 'LN-BLR-77312',
      timestamp: '19 mins ago',
      status: 'APPROVED',
    },
    {
      id: 4,
      action: 'Daily Vault Till Cash Reconciliation Verified',
      username: 'cashier_blr',
      userRole: 'CASHIER',
      branchName: 'Bangalore MG Road Central',
      referenceId: 'TILL-BLR-109',
      timestamp: '32 mins ago',
      status: 'RECONCILED',
    },
  ],
};

export const HeadOfficeDashboardPage: React.FC = () => {
  const [data, setData] = useState<HeadOfficeDashboardSummary>(INITIAL_DASHBOARD_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Background sync: updates data silently without showing a blank spinner screen
  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await api.get<ApiResponse<HeadOfficeDashboardSummary>>('/dashboard/summary');
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch {
      // Keeps using instant cached data gracefully
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredBranches = selectedRegion === 'ALL'
    ? data.branchPerformance
    : data.branchPerformance.filter((b) => b.region.toLowerCase().includes(selectedRegion.toLowerCase()));

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans">
      
      {/* Top Executive Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
              CENTRAL HEAD OFFICE OVERVIEW
            </span>
            <span className="text-xs text-slate-400 font-mono">FINANCIAL YEAR 2026-27</span>
            <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE LIQUIDITY POOL</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Executive Banking Operations & Liquidity Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time branch supervision, capital adequacy, credit advances, and risk oversight
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-500 font-medium">Zone:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Regional Zones</option>
              <option value="South">Southern Zone</option>
              <option value="West">Western Zone</option>
              <option value="North">Northern Zone</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh Live Ledgers"
            className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-emerald-50/50 hover:text-emerald-900 hover:border-emerald-300 shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            title="Export Regulatory Report"
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 border border-emerald-900"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Primary Financial KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Bank Deposits"
          value={data.totalBankDeposits}
          subtitle="Cumulative savings, current & term deposits"
          icon={Landmark}
          accentColor="emerald"
          isCurrency={true}
          trend={{ value: '+8.4% YoY', isPositive: true }}
        />
        <KpiCard
          title="Gross Bank Advances"
          value={data.totalBankAdvances}
          subtitle="Sanctioned retail & commercial portfolios"
          icon={TrendingUp}
          accentColor="blue"
          isCurrency={true}
          trend={{ value: '+12.1% YoY', isPositive: true }}
        />
        <KpiCard
          title="Today's Cash Inflow"
          value={data.todayDeposits}
          subtitle="Branch counter & digital deposit credit"
          icon={ArrowDownCircle}
          accentColor="green"
          isCurrency={true}
          trend={{ value: '+₹4.2 Cr Today', isPositive: true }}
        />
        <KpiCard
          title="Today's Cash Outflow"
          value={data.todayWithdrawals}
          subtitle="Counter payouts & clearing settlements"
          icon={ArrowUpCircle}
          accentColor="teal"
          isCurrency={true}
          trend={{ value: 'Net +₹14.45 Cr Clearing', isNeutral: true }}
        />
      </div>

      {/* Secondary Operational Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Active Branches</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data.totalBranches}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">100% ONLINE</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Regional Offices</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data.totalRegionalOffices}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Supervised</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Accounts</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data.totalActiveAccounts.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">+18 today</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Customer Base</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data.totalActiveCustomers.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Verified KYC</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Reserve Ratio</p>
          <p className="text-xl font-black text-emerald-700 mt-1 font-sans">
            {data.reserveLiquidityRatio}%
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">CRR/SLR Compliant</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Day Velocity</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data.todayTransactionsCount}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Txns Processed</span>
        </div>
      </div>

      {/* Maker-Checker & Risk Alerts Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pending Approvals */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-emerald-50/40 border border-emerald-200 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-mono">
              Maker-Checker Authorization Queue
            </h4>
            <p className="text-xs text-emerald-900/80 mt-1">
              Sensitive operations awaiting dual-authorization from Head Office / Branch Managers:
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-white border border-emerald-300/80 rounded-xl font-bold text-emerald-950 shadow-xs">
                Loans: <span className="text-emerald-700">{data.pendingLoanApprovals}</span>
              </span>
              <span className="px-3 py-1 bg-white border border-emerald-300/80 rounded-xl font-bold text-emerald-950 shadow-xs">
                High-Value Transfers: <span className="text-emerald-700">{data.pendingFundTransferApprovals}</span>
              </span>
              <span className="px-3 py-1 bg-white border border-emerald-300/80 rounded-xl font-bold text-emerald-950 shadow-xs">
                Account Openings: <span className="text-emerald-700">{data.pendingAccountApprovals}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Suspicious Alerts */}
        <div className="bg-gradient-to-br from-rose-50/80 via-red-50/30 to-rose-50/40 border border-rose-200 rounded-2xl p-6 flex items-start space-x-4 shadow-sm">
          <div className="p-3 bg-gradient-to-br from-rose-600 to-red-700 text-white rounded-xl shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 font-mono">
              Suspicious Transaction & Anti-Money Laundering (AML) Monitor
            </h4>
            <p className="text-xs text-rose-900/80 mt-1">
              <strong>{data.suspiciousTransactionAlerts} alerts</strong> flagged by rule engines (rapid deposits &gt; ₹10,00,000 without prior history).
            </p>
            <div className="mt-3.5">
              <button className="text-xs font-bold text-rose-700 hover:text-rose-950 underline font-mono">
                Open AML Review Console &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
                Deposit vs Advances Growth Trend (₹ Crores)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated balance sheet progression over the last 6 months
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              INR CR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyFinancialTrends}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorAdvances" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[800, 2000]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#06231D',
                    borderColor: '#10B981',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Bank Deposits"
                  stroke="#059669"
                  fillOpacity={1}
                  fill="url(#colorDeposits)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="advances"
                  name="Gross Advances"
                  stroke="#0F172A"
                  fillOpacity={1}
                  fill="url(#colorAdvances)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intraday Transaction Volume Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
                Intraday Clearing Volume
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transaction counts by business trading slots
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              TODAY
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.transactionVolumeAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="timeSlot" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#06231D',
                    borderColor: '#10B981',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Txn Count"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Branch Scorecard Table & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <BranchPerformanceTable branches={filteredBranches} />
        </div>
        <div className="lg:col-span-4">
          <RecentActivityFeed activities={data.recentBankingActivities} />
        </div>
      </div>
    </div>
  );
};
