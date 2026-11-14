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
  Download
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

export const HeadOfficeDashboardPage: React.FC = () => {
  const [data, setData] = useState<HeadOfficeDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<HeadOfficeDashboardSummary>>('/dashboard/summary');
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve consolidated banking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-bank-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-slatebank-600">
          CONSOLIDATING MULTI-BRANCH FINANCIAL LEDGERS...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <p className="font-bold">Error loading Head Office Dashboard</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const filteredBranches = selectedRegion === 'ALL'
    ? data.branchPerformance
    : data.branchPerformance.filter((b) => b.region.toLowerCase().includes(selectedRegion.toLowerCase()));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Controls & Date Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slatebank-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bank-100 text-bank-800 border border-bank-200">
              HEAD OFFICE CONSOLIDATED
            </span>
            <span className="text-xs text-slatebank-400 font-mono">FINANCIAL YEAR 2026-27</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 tracking-tight mt-1">
            Executive Banking Operations & Liquidity Portal
          </h1>
          <p className="text-xs text-slatebank-500">
            Real-time branch supervision, capital adequacy, credit advances, and risk oversight
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-slatebank-200 rounded-lg px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slatebank-500" />
            <span className="text-slatebank-500 font-medium">Zone:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent font-semibold text-slatebank-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Regional Zones</option>
              <option value="South">Southern Zone</option>
              <option value="West">Western Zone</option>
              <option value="North">Northern Zone</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 bg-white border border-slatebank-200 text-slatebank-700 rounded-lg hover:bg-slatebank-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            title="Export Regulatory Report"
            className="flex items-center space-x-1.5 px-3 py-2 bg-bank-900 text-white rounded-lg text-xs font-semibold hover:bg-bank-800 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
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
          accentColor="navy"
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
          accentColor="amber"
          isCurrency={true}
          trend={{ value: 'Net +₹14.45 Cr Clearing', isNeutral: true }}
        />
      </div>

      {/* Secondary Operational Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Active Branches</p>
          <p className="text-xl font-extrabold text-slatebank-900 mt-1 financial-num">
            {data.totalBranches}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold font-mono">100% ONLINE</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Regional Offices</p>
          <p className="text-xl font-extrabold text-slatebank-900 mt-1 financial-num">
            {data.totalRegionalOffices}
          </p>
          <span className="text-[10px] text-slatebank-400 font-mono">Supervised</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Total Accounts</p>
          <p className="text-xl font-extrabold text-slatebank-900 mt-1 financial-num">
            {data.totalActiveAccounts.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">+18 today</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Customer Base</p>
          <p className="text-xl font-extrabold text-slatebank-900 mt-1 financial-num">
            {data.totalActiveCustomers.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slatebank-400 font-mono">Verified KYC</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Reserve Ratio</p>
          <p className="text-xl font-extrabold text-bank-700 mt-1 financial-num">
            {data.reserveLiquidityRatio}%
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">CRR/SLR Compliant</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slatebank-200">
          <p className="text-[11px] font-bold text-slatebank-500 uppercase">Day Velocity</p>
          <p className="text-xl font-extrabold text-slatebank-900 mt-1 financial-num">
            {data.todayTransactionsCount}
          </p>
          <span className="text-[10px] text-slatebank-400 font-mono">Txns Handled</span>
        </div>
      </div>

      {/* Maker-Checker & Risk Alerts Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex items-start space-x-4">
          <div className="p-3 bg-amber-500 text-white rounded-lg shadow-sm">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Maker-Checker Authorization Queue
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              Sensitive operations awaiting dual-authorization from Head Office / Branch Managers:
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white border border-amber-300 rounded-md font-semibold text-amber-900">
                Loans: <strong>{data.pendingLoanApprovals}</strong>
              </span>
              <span className="px-2.5 py-1 bg-white border border-amber-300 rounded-md font-semibold text-amber-900">
                High-Value Transfers: <strong>{data.pendingFundTransferApprovals}</strong>
              </span>
              <span className="px-2.5 py-1 bg-white border border-amber-300 rounded-md font-semibold text-amber-900">
                Account Openings: <strong>{data.pendingAccountApprovals}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Suspicious Alerts */}
        <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-xl p-5 flex items-start space-x-4">
          <div className="p-3 bg-rose-600 text-white rounded-lg shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Suspicious Transaction & Anti-Money Laundering (AML) Monitor
            </h4>
            <p className="text-xs text-rose-800 mt-1">
              <strong>{data.suspiciousTransactionAlerts} alerts</strong> flagged by rule engines (rapid deposits &gt; ₹10,00,000 without prior history).
            </p>
            <div className="mt-3">
              <button className="text-xs font-bold text-rose-700 hover:text-rose-900 underline">
                Open AML Review Console &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slatebank-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slatebank-900 uppercase tracking-wide">
                Deposit vs Advances Growth Trend (₹ Crores)
              </h3>
              <p className="text-xs text-slatebank-500">
                Consolidated balance sheet progression over the last 6 months
              </p>
            </div>
            <span className="text-[10px] font-mono bg-slatebank-100 text-slatebank-600 px-2 py-1 rounded">
              INR CR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyFinancialTrends}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A192F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0A192F" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorAdvances" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[800, 2000]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Bank Deposits"
                  stroke="#0A192F"
                  fillOpacity={1}
                  fill="url(#colorDeposits)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="advances"
                  name="Gross Advances"
                  stroke="#2563EB"
                  fillOpacity={1}
                  fill="url(#colorAdvances)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intraday Transaction Volume Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slatebank-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slatebank-900 uppercase tracking-wide">
                Intraday Clearing Volume
              </h3>
              <p className="text-xs text-slatebank-500">
                Transaction counts by business trading slots
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">
              TODAY
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.transactionVolumeAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="timeSlot" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Txn Count"
                  fill="#1E3E6D"
                  radius={[4, 4, 0, 0]}
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
