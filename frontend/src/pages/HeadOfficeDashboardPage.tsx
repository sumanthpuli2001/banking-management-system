import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { HeadOfficeDashboardSummary, EodBatchRun } from '../types/dashboard';
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
  Sparkles,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Layers,
  Sliders,
  History,
  FileText,
  AlertOctagon,
  X
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

type TabType = 'executive' | 'branches' | 'batchClosing' | 'auditFeed';

export const HeadOfficeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [data, setData] = useState<HeadOfficeDashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // EOD / SOD Batch States
  const [latestBatchRun, setLatestBatchRun] = useState<EodBatchRun | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'EOD' | 'SOD'>('EOD');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await api.get<ApiResponse<HeadOfficeDashboardSummary>>('/dashboard/summary');
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  const fetchLatestBatch = async () => {
    try {
      const res = await api.get<ApiResponse<EodBatchRun>>('/eod/latest');
      if (res.data.success && res.data.data) {
        setLatestBatchRun(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLatestBatch();
  }, []);

  const handleRunEod = async () => {
    setBatchRunning(true);
    setBatchActionType('EOD');
    try {
      const res = await api.post<ApiResponse<{ batchRunId: number; message: string; executedSteps: any[] }>>('/eod/run');
      if (res.data?.success) {
        showToast(res.data.message || 'End-of-Day batch completed successfully!');
        fetchLatestBatch();
        fetchDashboardData();
      } else {
        showToast(res.data?.message || 'EOD Batch failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error executing EOD batch.', 'error');
    } finally {
      setBatchRunning(false);
    }
  };

  const handleRunSod = async () => {
    setBatchRunning(true);
    setBatchActionType('SOD');
    try {
      const res = await api.post<ApiResponse<{ batchRunId: number; message: string; executedSteps: any[] }>>('/eod/run-sod');
      if (res.data?.success) {
        showToast(res.data.message || 'Start-of-Day batch completed successfully!');
        fetchLatestBatch();
        fetchDashboardData();
      } else {
        showToast(res.data?.message || 'SOD Batch failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error executing SOD batch.', 'error');
    } finally {
      setBatchRunning(false);
    }
  };

  const filteredBranches = !data?.branchPerformance
    ? []
    : selectedRegion === 'ALL'
    ? data.branchPerformance
    : data.branchPerformance.filter((b) => b.region.toLowerCase().includes(selectedRegion.toLowerCase()));

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
          toastMessage.type === 'success'
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
            : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-300 shrink-0" />
            )}
            <p className="text-xs font-semibold">{toastMessage.text}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Executive Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
              CENTRAL HEAD OFFICE CBS OPERATIONS
            </span>
            <span className="text-xs text-slate-400 font-mono">FINANCIAL YEAR 2026-27</span>
            <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE LIQUIDITY POOL</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Building className="h-7 w-7 text-emerald-700" />
            Executive Core Banking Command & Oversight Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-branch consolidation, double-entry trial balance, regulatory reserve holding, and automated batch closing.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              fetchDashboardData();
              fetchLatestBatch();
            }}
            title="Refresh Live Data"
            className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-emerald-50/50 hover:text-emerald-900 shadow-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleRunEod}
            disabled={batchRunning}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all border border-emerald-900"
          >
            <Play className={`w-3.5 h-3.5 ${batchRunning ? 'animate-spin' : ''}`} />
            <span>Run EOD Closing</span>
          </button>
        </div>
      </div>

      {/* Primary Financial KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Bank Deposits"
          value={data?.totalBankDeposits ?? 1845200000}
          subtitle="Cumulative savings, current & term deposits"
          icon={Landmark}
          accentColor="emerald"
          isCurrency={true}
          trend={{ value: '+8.4% YoY', isPositive: true }}
        />
        <KpiCard
          title="Gross Bank Advances"
          value={data?.totalBankAdvances ?? 1210400000}
          subtitle="Sanctioned retail & commercial portfolios"
          icon={TrendingUp}
          accentColor="blue"
          isCurrency={true}
          trend={{ value: '+12.1% YoY', isPositive: true }}
        />
        <KpiCard
          title="Today's Cash Inflow"
          value={data?.todayDeposits ?? 42600000}
          subtitle="Branch counter & digital deposit credit"
          icon={ArrowDownCircle}
          accentColor="green"
          isCurrency={true}
          trend={{ value: '+₹4.2 Cr Today', isPositive: true }}
        />
        <KpiCard
          title="Today's Cash Outflow"
          value={data?.todayWithdrawals ?? 28150000}
          subtitle="Counter payouts & clearing settlements"
          icon={ArrowUpCircle}
          accentColor="teal"
          isCurrency={true}
          trend={{ value: 'Net Clearing Settlement', isNeutral: true }}
        />
      </div>

      {/* Secondary Regulatory & Operational Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Active Branches</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {data?.totalBranches ?? 6}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">100% ONLINE</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Accounts</p>
          <p className="text-xl font-black text-slate-900 mt-1 font-sans">
            {(data?.totalActiveAccounts ?? 19450).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">Verified CBS</span>
        </div>
        <div 
          onClick={() => navigate('/regulatory')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono group-hover:text-emerald-700">CRR Rate</p>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1 font-sans">
            {data?.crrPercentage ?? 4.50}%
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">
            {data?.crrCompliant ? 'RBI COMPLIANT' : 'MONITORED'}
          </span>
        </div>
        <div 
          onClick={() => navigate('/regulatory')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono group-hover:text-emerald-700">SLR Rate</p>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 mt-1 font-sans">
            {data?.slrPercentage ?? 18.00}%
          </p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">
            {data?.slrCompliant ? 'RBI COMPLIANT' : 'MONITORED'}
          </span>
        </div>
        <div 
          onClick={() => navigate('/loans')}
          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-400 cursor-pointer transition group"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono group-hover:text-emerald-700">Gross NPA</p>
          <p className="text-xl font-black text-slate-800 mt-1 font-sans">
            {data?.grossNpaRatio ?? 1.45}%
          </p>
          <span className="text-[10px] text-slate-500 font-mono">IRAC Provisioned</span>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
          <p className="text-[10px] font-bold text-emerald-400 uppercase font-mono">EOD Status</p>
          <p className="text-base font-black text-white mt-1 font-sans truncate">
            {data?.eodStatus ?? 'COMPLETED'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block truncate">
            {data?.eodLastRunDate ?? 'Today'}
          </span>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('executive')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'executive'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Executive CBS Command Center
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'branches'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-emerald-600" />
          Branch Network Consolidation
        </button>
        <button
          onClick={() => setActiveTab('batchClosing')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'batchClosing'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          EOD / SOD Batch Closing Orchestrator
        </button>
        <button
          onClick={() => setActiveTab('auditFeed')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'auditFeed'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          Consolidated Audit & System Feed
        </button>
      </div>

      {/* TAB 1: EXECUTIVE CBS COMMAND CENTER */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          {/* Maker-Checker & Risk Alerts Center */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pending Approvals */}
            <div 
              onClick={() => navigate('/approvals')}
              className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-start space-x-4 shadow-sm hover:border-emerald-400 cursor-pointer transition group"
            >
              <div className="p-3 bg-emerald-800 text-white rounded-xl shadow-md">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 font-mono group-hover:text-emerald-800">
                  Maker-Checker Dual-Control Queue
                </h4>
                <p className="text-xs text-emerald-900/80 mt-1">
                  Sensitive transactions awaiting four-eyes authorization across tiers:
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 shadow-xs">
                    Pending Queue: <span className="text-emerald-700">{data?.pendingMakerCheckerCount ?? 0}</span>
                  </span>
                  <span className="px-3 py-1 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-950 shadow-xs">
                    Escalated: <span className="text-amber-800">{data?.escalatedMakerCheckerCount ?? 0}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Suspicious Alerts */}
            <div 
              onClick={() => navigate('/compliance')}
              className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 flex items-start space-x-4 shadow-sm hover:border-rose-400 cursor-pointer transition group"
            >
              <div className="p-3 bg-rose-800 text-white rounded-xl shadow-md">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 font-mono group-hover:text-rose-800">
                  Suspicious Transaction & AML Surveillance Monitor
                </h4>
                <p className="text-xs text-rose-900/80 mt-1">
                  <strong>{data?.activeAmlAlertsCount ?? 0} alerts</strong> flagged by rule engines (structuring, large CTRs, or PEP activity).
                </p>
                <div className="mt-3">
                  <span className="text-xs font-bold text-rose-800 underline font-mono">
                    Open AML Surveillance Console &rarr;
                  </span>
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
                  <AreaChart data={data?.monthlyFinancialTrends || []}>
                    <defs>
                      <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#047857" stopOpacity={0.0}/>
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
                      stroke="#047857"
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
                  <BarChart data={data?.transactionVolumeAnalytics || []}>
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
                      fill="#047857"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRANCH NETWORK CONSOLIDATION */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-700 font-mono">Filter by Regional Zone:</span>
              <div className="flex gap-1.5 ml-2">
                {['ALL', 'South', 'West', 'North'].map((zone) => (
                  <button
                    key={zone}
                    onClick={() => setSelectedRegion(zone)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedRegion === zone
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {zone === 'ALL' ? 'All Zones' : `${zone} Zone`}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredBranches.length} branch nodes
            </span>
          </div>

          <BranchPerformanceTable branches={filteredBranches} />
        </div>
      )}

      {/* TAB 3: EOD / SOD BATCH CLOSING ORCHESTRATION */}
      {activeTab === 'batchClosing' && (
        <div className="space-y-6">
          {/* EOD Banner & Trigger Card */}
          <div className="bg-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  Automated Core Banking Batch Engine
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  End-of-Day (EOD) & Start-of-Day (SOD) Orchestrator
                </h3>
                <p className="text-xs text-emerald-200/80 mt-1 max-w-2xl leading-relaxed">
                  Sequentially executes the 5 statutory closing proofs: Branch drawer balance verification, 
                  Double-entry GL proof (Total DR = Total CR), daily interest accrual calculation, 
                  CRR/SLR regulatory reserve proof, and final financial period sealing.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleRunSod}
                  disabled={batchRunning}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${batchRunning && batchActionType === 'SOD' ? 'animate-spin' : ''}`} />
                  Run SOD Opening
                </button>
                <button
                  onClick={handleRunEod}
                  disabled={batchRunning}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Play className={`w-3.5 h-3.5 ${batchRunning && batchActionType === 'EOD' ? 'animate-spin' : ''}`} />
                  Execute Full EOD Closing
                </button>
              </div>
            </div>
          </div>

          {/* Latest Execution Details */}
          {latestBatchRun ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-400">
                    Latest Execution Summary
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Batch Run #{latestBatchRun.id} — {latestBatchRun.batchType} for {latestBatchRun.batchDate}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    latestBatchRun.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {latestBatchRun.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    {latestBatchRun.status}
                  </span>
                </div>
              </div>

              {/* Progress Steps List */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-600 uppercase font-mono">
                  Verified Batch Step Pipeline:
                </h5>
                <div className="grid grid-cols-1 gap-2.5">
                  {latestBatchRun.steps?.map((step) => (
                    <div
                      key={step.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg mt-0.5 ${
                          step.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {step.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              Step {step.stepNumber}: {step.stepName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({step.stepCode})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {step.details}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {step.durationMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs">No previous EOD batch has been executed today. Click "Execute Full EOD Closing" above to trigger.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONSOLIDATED AUDIT & SYSTEM FEED */}
      {activeTab === 'auditFeed' && (
        <div className="space-y-4">
          <RecentActivityFeed activities={data?.recentBankingActivities || []} />
        </div>
      )}
    </div>
  );
};
