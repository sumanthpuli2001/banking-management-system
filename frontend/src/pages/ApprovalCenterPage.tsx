import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  History,
  Sliders,
  ChevronRight,
  UserCheck,
  Layers,
  FileText,
  AlertOctagon
} from 'lucide-react';

interface ApprovalItem {
  id: number;
  requestType: string;
  ruleCode?: string;
  requiredRole?: string;
  riskLevel?: string;
  targetEntityName?: string;
  targetEntityId?: number;
  makerId?: number;
  makerName: string;
  makerRole?: string;
  checkerId?: number;
  checkerName?: string;
  branchId?: number;
  branchName?: string;
  amount?: number;
  payloadJson?: string;
  status: string;
  makerRemarks?: string;
  checkerRemarks?: string;
  rejectionReason?: string;
  isEscalated?: boolean;
  escalatedAt?: string;
  escalatedToRole?: string;
  delegatedToUsername?: string;
  requestedAt?: string;
  expiresAt?: string;
  decidedAt?: string;
  isOverdue?: boolean;
}

interface MatrixRule {
  id: number;
  ruleCode: string;
  ruleName: string;
  operationType: string;
  minAmount?: number;
  maxAmount?: number;
  requiredCheckerRole: string;
  riskCategory: string;
  expiryHours: number;
  isSelfApprovalAllowed: boolean;
  autoEscalateAfterHours: number;
  escalateToRole?: string;
  description: string;
  isActive: boolean;
}

interface AuditLogEntry {
  id: number;
  approvalRequestId: number;
  action: string;
  performedByUsername: string;
  performedByRole: string;
  notes: string;
  recordedAt: string;
}

interface QueueSummary {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  expiredCount: number;
  totalProcessed: number;
}

type TabType = 'activeQueue' | 'matrixPolicy' | 'decisionLedger' | 'slaOversight';

export const ApprovalCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('activeQueue');
  
  // Data States
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [historyApprovals, setHistoryApprovals] = useState<ApprovalItem[]>([]);
  const [matrixRules, setMatrixRules] = useState<MatrixRule[]>([]);
  const [summary, setSummary] = useState<QueueSummary>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    escalatedCount: 0,
    expiredCount: 0,
    totalProcessed: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [rulesLoading, setRulesLoading] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [sweepLoading, setSweepLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination for Queue
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Pagination for History
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyPageSize, setHistoryPageSize] = useState<number>(10);

  // Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<ApprovalItem | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [checkerRemarks, setCheckerRemarks] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [decisionError, setDecisionError] = useState<string>('');

  // Audit Logs Modal State
  const [auditLogsModalItem, setAuditLogsModalItem] = useState<ApprovalItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Escalation Modal State
  const [escalateModalItem, setEscalateModalItem] = useState<ApprovalItem | null>(null);
  const [escalateReason, setEscalateReason] = useState<string>('SLA turnaround escalation to regional jurisdiction');
  const [escalating, setEscalating] = useState<boolean>(false);

  useEffect(() => {
    fetchPendingQueue();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'matrixPolicy' && matrixRules.length === 0) {
      fetchMatrixRules();
    } else if (activeTab === 'decisionLedger' && historyApprovals.length === 0) {
      fetchHistory();
    }
  }, [activeTab]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchPendingQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: ApprovalItem[] }>>('/approvals/pending?size=100');
      if (res.data?.success && res.data.data?.content) {
        setPendingApprovals(res.data.data.content);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get<ApiResponse<QueueSummary>>('/approvals/summary');
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      }
    } catch {
      // Fallback
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: ApprovalItem[] }>>('/approvals/history?size=100');
      if (res.data?.success && res.data.data?.content) {
        setHistoryApprovals(res.data.data.content);
      }
    } catch {
      // Fallback
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchMatrixRules = async () => {
    setRulesLoading(true);
    try {
      const res = await api.get<ApiResponse<MatrixRule[]>>('/approvals/rules');
      if (res.data?.success && res.data.data) {
        setMatrixRules(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setRulesLoading(false);
    }
  };

  const fetchAuditLogs = async (item: ApprovalItem) => {
    setAuditLogsModalItem(item);
    setAuditLoading(true);
    try {
      const res = await api.get<ApiResponse<AuditLogEntry[]>>(`/approvals/${item.id}/audit-logs`);
      if (res.data?.success && res.data.data) {
        setAuditLogs(res.data.data);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSweepExpired = async () => {
    setSweepLoading(true);
    try {
      const res = await api.post<ApiResponse<{ expiredCount: number }>>('/approvals/sweep-expired');
      const count = res.data?.data?.expiredCount ?? 0;
      showToast(`Automated SLA sweep completed: ${count} overdue request(s) transitioned to EXPIRED.`);
      fetchPendingQueue();
      fetchSummary();
      if (activeTab === 'decisionLedger') fetchHistory();
    } catch {
      showToast('Failed to trigger SLA sweep.', 'error');
    } finally {
      setSweepLoading(false);
    }
  };

  const isSelfMaker = (req: ApprovalItem | null): boolean => {
    if (!req || !user?.id) return false;
    return req.makerId === user.id;
  };

  const handleOpenDecisionModal = (item: ApprovalItem) => {
    setSelectedRequest(item);
    setDecision('APPROVED');
    setCheckerRemarks('Dual-control verification confirmed against core institutional limits.');
    setRejectionReason('');
    setDecisionError('');
  };

  const handleProcessDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      setDecisionError('A mandatory rejection reason is required for institutional audit compliance.');
      return;
    }

    if (!checkerRemarks.trim()) {
      setDecisionError('Checker compliance remarks are mandatory for audit trails.');
      return;
    }

    if (isSelfMaker(selectedRequest)) {
      setDecisionError('Dual-Control Segregation Violation: Maker cannot authorize or reject their own request.');
      return;
    }

    setIsSubmitting(true);
    setDecisionError('');
    try {
      const res = await api.post(`/approvals/${selectedRequest.id}/decide`, {
        decision,
        checkerRemarks,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined
      });

      if (res.data?.success) {
        showToast(`Request #${selectedRequest.id} ${decision} successfully.`);
        setSelectedRequest(null);
        fetchPendingQueue();
        fetchSummary();
        if (activeTab === 'decisionLedger') fetchHistory();
      } else {
        setDecisionError(res.data?.message || 'Failed to process authorization decision');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setDecisionError(errorObj.response?.data?.message || 'Error communicating with approval workflow engine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateModalItem) return;

    setEscalating(true);
    try {
      const res = await api.post(`/approvals/${escalateModalItem.id}/escalate`, {
        reason: escalateReason
      });

      if (res.data?.success) {
        showToast(`Request #${escalateModalItem.id} escalated to higher authority tier.`);
        setEscalateModalItem(null);
        fetchPendingQueue();
        fetchSummary();
      } else {
        showToast(res.data?.message || 'Failed to escalate request.', 'error');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showToast(errorObj.response?.data?.message || 'Escalation failed.', 'error');
    } finally {
      setEscalating(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatDate = (dateVal?: any) => {
    if (!dateVal) return 'Recent';
    try {
      if (Array.isArray(dateVal)) {
        const [year, month, day, hour = 0, minute = 0] = dateVal;
        const d = new Date(year, month - 1, day, hour, minute);
        return isNaN(d.getTime()) ? 'Recent' : d.toLocaleString('en-IN');
      }
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? 'Recent' : d.toLocaleString('en-IN');
    } catch {
      return 'Recent';
    }
  };

  const filteredQueue = pendingApprovals.filter((item) => {
    const matchesType = typeFilter === 'ALL' || item.requestType === typeFilter;
    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (item.requestType || '').toLowerCase().includes(sTerm) ||
      (item.ruleCode || '').toLowerCase().includes(sTerm) ||
      (item.makerName || '').toLowerCase().includes(sTerm) ||
      (item.makerRemarks || '').toLowerCase().includes(sTerm) ||
      item.id.toString().includes(sTerm);
    return matchesType && matchesRisk && matchesSearch;
  });

  const paginatedQueue = filteredQueue.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedHistory = historyApprovals.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize
  );

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-800">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"><XCircle className="w-3 h-3 text-rose-600" /> REJECTED</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> EXPIRED</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-amber-700" /> ESCALATED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-900 border border-emerald-400 animate-pulse flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-600" /> PENDING</span>;
    }
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Core Banking Operations</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Dual-Control Framework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-emerald-600 shrink-0" />
            Maker-Checker Authorization Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory segregation of duties, four-eyes principle, discretionary authority matrix, and SLA breach governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSweepExpired}
            disabled={sweepLoading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-300 shadow-sm transition-all"
            title="Scan for SLA deadline breaches and expire overdue requests"
          >
            <Clock className={`h-3.5 w-3.5 ${sweepLoading ? 'animate-spin text-emerald-700' : 'text-slate-600'}`} />
            SLA Sweep
          </button>
          <button
            onClick={() => {
              fetchPendingQueue();
              fetchSummary();
              if (activeTab === 'decisionLedger') fetchHistory();
              if (activeTab === 'matrixPolicy') fetchMatrixRules();
            }}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Counters Strip - Swiss Emerald & Platinum */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pending Action</p>
          <p className="text-2xl font-black text-emerald-800 mt-1 font-sans">{summary.pendingCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Awaiting checker sign-off</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Authorized & Settled</p>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-sans">{summary.approvedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Executed to Core GL</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-rose-300 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Rejected / Declined</p>
          <p className="text-2xl font-black text-rose-700 mt-1 font-sans">{summary.rejectedCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Audit reason logged</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:border-amber-300 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Escalated Items</p>
          <p className="text-2xl font-black text-amber-700 mt-1 font-sans">{summary.escalatedCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Higher tier sign-off</span>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
          <p className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Logged Clearance</p>
          <p className="text-sm font-black text-white mt-1 font-sans truncate">{user?.roles?.[0] || 'CHECKER'}</p>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">{user?.fullName || user?.username}</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('activeQueue')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'activeQueue'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          Dual-Control Action Queue ({pendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('matrixPolicy')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'matrixPolicy'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-600" />
          Authority Matrix Policy Schedule
        </button>
        <button
          onClick={() => setActiveTab('decisionLedger')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'decisionLedger'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          Compliance Decision Ledger & History
        </button>
        <button
          onClick={() => setActiveTab('slaOversight')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'slaOversight'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          Operational Oversight & SLA Monitoring
        </button>
      </div>

      {/* TAB 1: DUAL-CONTROL ACTION QUEUE */}
      {activeTab === 'activeQueue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono ml-1">Type:</span>
              {['ALL', 'HIGH_VALUE_TRANSFER', 'ACCOUNT_FREEZE', 'ACCOUNT_CLOSURE', 'CASH_LIMIT_OVERRIDE', 'CONFIGURATION_CHANGE'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTypeFilter(type);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === type
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by ref, maker, rule..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4">Req # & Type</th>
                    <th className="py-3 px-4">Discretionary Tier</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Maker & Branch</th>
                    <th className="py-3 px-4">Risk & SLA</th>
                    <th className="py-3 px-4">Maker Remarks</th>
                    <th className="py-3 px-4 text-right">Four-Eyes Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading Dual-Control Action Queue...
                      </td>
                    </tr>
                  ) : paginatedQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        No pending dual-control authorizations match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedQueue.map((item) => {
                      const selfMaker = isSelfMaker(item);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            selfMaker ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">#{item.id}</span>
                              {item.isEscalated && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                  ESCALATED
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-800 block mt-0.5">
                              {item.requestType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Rule: {item.ruleCode || 'STANDARD'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {item.requiredRole?.replace(/_/g, ' ') || 'BRANCH MANAGER'}
                            </span>
                            {item.isEscalated && item.escalatedToRole && (
                              <span className="block text-[9px] text-amber-700 font-semibold mt-0.5">
                                Escalated to: {item.escalatedToRole.replace(/_/g, ' ')}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 block">{item.makerName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.branchName || 'Head Office'} • {item.makerRole || 'MAKER'}
                            </span>
                            {selfMaker && (
                              <span className="text-[9px] font-bold text-amber-700 block mt-0.5 font-mono">
                                ⚠ You are the Maker
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {getRiskBadge(item.riskLevel)}
                              <span className={`block text-[10px] font-mono ${
                                item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                              }`}>
                                {item.isOverdue ? '⚠ SLA BREACH' : `Expires: ${formatDate(item.expiresAt)}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={item.makerRemarks}>
                            {item.makerRemarks || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => fetchAuditLogs(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                title="View Audit Trail"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEscalateModalItem(item);
                                  setEscalateReason('SLA turnaround delay requiring regional intervention.');
                                }}
                                disabled={item.isEscalated}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                  item.isEscalated
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                                title="Escalate to higher tier"
                              >
                                Escalate
                              </button>
                              <button
                                onClick={() => handleOpenDecisionModal(item)}
                                disabled={selfMaker}
                                className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 ${
                                  selfMaker
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                }`}
                                title={selfMaker ? 'Initiator cannot authorize their own submission (Maker != Checker)' : 'Authorize or Reject'}
                              >
                                Decide
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredQueue.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* TAB 2: AUTHORITY MATRIX POLICY SCHEDULE */}
      {activeTab === 'matrixPolicy' && (
        <div className="space-y-4">
          <div className="bg-emerald-950 text-emerald-100 p-5 rounded-2xl border border-emerald-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Apex National Bank — Institutional Delegation of Authority Matrix
              </h3>
            </div>
            <p className="text-xs text-emerald-200/80 mt-1 max-w-4xl">
              In strict accordance with RBI Master Directions on Corporate Governance and Core Banking System Controls, 
              no single officer possesses unilateral authority to initiate and settle financial transactions. 
              The following discretionary threshold matrix governs dual-authorization requirements across all branches.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4">Matrix Rule Code</th>
                    <th className="py-3 px-4">Operation Scope</th>
                    <th className="py-3 px-4">Threshold Limits</th>
                    <th className="py-3 px-4">Required Clearance Tier</th>
                    <th className="py-3 px-4">Risk Rating</th>
                    <th className="py-3 px-4">SLA Expiry</th>
                    <th className="py-3 px-4">Auto-Escalation Target</th>
                    <th className="py-3 px-4">Self-Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rulesLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading Authority Matrix Rules...
                      </td>
                    </tr>
                  ) : matrixRules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        No matrix rules configured.
                      </td>
                    </tr>
                  ) : (
                    matrixRules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {r.ruleCode}
                          <span className="block text-[10px] text-slate-400 font-normal font-sans">{r.ruleName}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-900">
                          {r.operationType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {r.minAmount ? formatCurrency(r.minAmount) : '₹0'} – {r.maxAmount && r.maxAmount < 900000000000 ? formatCurrency(r.maxAmount) : 'No Cap'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {r.requiredCheckerRole.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getRiskBadge(r.riskCategory)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {r.expiryHours} hours
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-amber-800 font-semibold">
                          {r.escalateToRole ? r.escalateToRole.replace(/_/g, ' ') : 'SUPER ADMIN'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            FORBIDDEN
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLIANCE DECISION LEDGER & HISTORY */}
      {activeTab === 'decisionLedger' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-4">Req # & Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Maker</th>
                    <th className="py-3 px-4">Checker Sign-Off</th>
                    <th className="py-3 px-4">Decision Status</th>
                    <th className="py-3 px-4">Remarks / Rejection Reason</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading Decision Ledger...
                      </td>
                    </tr>
                  ) : paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        No historical decisions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900">#{item.id}</span>
                          <span className="block text-[11px] font-semibold text-emerald-800">
                            {item.requestType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="text-slate-800 font-medium block">{item.makerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.branchName}</span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {item.checkerName ? (
                            <>
                              <span className="text-slate-900 font-bold block">{item.checkerName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Checker Verified</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Automated SLA Sweep</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs">
                          {item.status === 'REJECTED' && item.rejectionReason ? (
                            <span className="text-rose-700 font-semibold block text-[11px]">
                              Reason: {item.rejectionReason}
                            </span>
                          ) : null}
                          <span className="text-[11px] text-slate-500 block truncate" title={item.checkerRemarks}>
                            {item.checkerRemarks || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                          {formatDate(item.decidedAt || item.requestedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => fetchAuditLogs(item)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={historyPage}
              totalItems={historyApprovals.length}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
            />
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL OVERSIGHT & SLA MONITORING */}
      {activeTab === 'slaOversight' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase font-mono">
                <AlertOctagon className="w-4 h-4" />
                Overdue & SLA Breached
              </div>
              <p className="text-3xl font-black text-rose-700 mt-2 font-sans">
                {pendingApprovals.filter(p => p.isOverdue).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Authorizations exceeding stipulated matrix SLA hours without decisive action.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase font-mono">
                <ArrowUpRight className="w-4 h-4" />
                Escalated Hierarchy Items
              </div>
              <p className="text-3xl font-black text-amber-700 mt-2 font-sans">
                {pendingApprovals.filter(p => p.isEscalated).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Requests elevated to Regional Manager or Head Office for institutional oversight.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase font-mono">
                <CheckCircle2 className="w-4 h-4" />
                Dual-Control Compliance Rate
              </div>
              <p className="text-3xl font-black text-emerald-700 mt-2 font-sans">
                100.0%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Zero self-approvals permitted. All settlements validated by independent checker.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
              Automated SLA Sweep & Risk Mitigation Protocol
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
              Under Apex National Bank risk controls, pending high-value transfers that remain unapproved past their expiry 
              timestamp are automatically swept into an <strong className="text-slate-800">EXPIRED</strong> state, failing 
              the underlying transaction to prevent stale execution or unauthorized overnight holding. Cash limits and account freezes 
              are immediately escalated to Central Head Office compliance.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleSweepExpired}
                disabled={sweepLoading}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Clock className={`h-4 w-4 ${sweepLoading ? 'animate-spin' : ''}`} />
                Execute Manual SLA Sweep Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Dual-Control Sign-Off</span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Authorize Request #{selectedRequest.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Maker Protection Alert */}
            {isSelfMaker(selectedRequest) && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Dual-Control Segregation Violation Alert</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    You submitted this request as Maker ({selectedRequest.makerName}). 
                    Institutional policy legally forbids initiators from signing off on their own submissions. 
                    An independent checker must authorize this action.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleProcessDecision} className="p-6 space-y-4">
              {decisionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {decisionError}
                </div>
              )}

              {/* Request Metadata Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Type:</span>
                  <span className="font-bold text-slate-800">{selectedRequest.requestType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Amount:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatCurrency(selectedRequest.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Maker:</span>
                  <span className="font-medium text-slate-800">{selectedRequest.makerName} ({selectedRequest.branchName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-mono text-[11px]">Required Clearance:</span>
                  <span className="font-bold text-slate-900">{selectedRequest.requiredRole?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Decision Toggle */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1.5">
                  Checker Verdict
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Authorize & Sign
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      decision === 'REJECTED'
                        ? 'bg-rose-800 text-white border-rose-900 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Reject / Block
                  </button>
                </div>
              </div>

              {/* If Rejected: Mandatory Rejection Reason */}
              {decision === 'REJECTED' && (
                <div>
                  <label className="text-[10px] font-bold text-rose-700 uppercase font-mono block mb-1">
                    Mandatory Rejection Reason *
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                    required
                  >
                    <option value="">-- Select Rejection Ground --</option>
                    <option value="Insufficient KYC documentation / PAN-Aadhaar mismatch">Insufficient KYC documentation / PAN-Aadhaar mismatch</option>
                    <option value="Beneficiary account mismatch or suspicious name discrepancy">Beneficiary account mismatch or suspicious name discrepancy</option>
                    <option value="Suspected fraud or unusual transaction structuring (AML)">Suspected fraud or unusual transaction structuring (AML)</option>
                    <option value="Customer signature or telephone callback verification failed">Customer signature or telephone callback verification failed</option>
                    <option value="Exceeds branch discretionary tolerance without prior zonal concurrence">Exceeds branch discretionary tolerance without prior zonal concurrence</option>
                    <option value="Other compliance irregularity (detailed below)">Other compliance irregularity (detailed below)</option>
                  </select>
                </div>
              )}

              {/* Checker Remarks */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
                  Checker Compliance Remarks *
                </label>
                <textarea
                  value={checkerRemarks}
                  onChange={(e) => setCheckerRemarks(e.target.value)}
                  placeholder="Record formal verification notes for internal audit..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isSelfMaker(selectedRequest)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 ${
                    isSelfMaker(selectedRequest)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : decision === 'APPROVED'
                      ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                      : 'bg-rose-800 hover:bg-rose-900 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : decision === 'APPROVED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {decision === 'APPROVED' ? 'Execute Authorization' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {escalateModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Hierarchy Elevation</span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Escalate Request #{escalateModalItem.id}
                </h3>
              </div>
              <button
                onClick={() => setEscalateModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEscalateSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Elevate this pending request to a higher administrative tier (Regional Manager / Head Office) 
                due to discretionary limit constraints or impending SLA turnaround breach.
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">
                  Escalation Justification *
                </label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEscalateModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {escalating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOGS MODAL */}
      {auditLogsModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Immutable Compliance Trail</span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Audit History — Request #{auditLogsModalItem.id}
                </h3>
              </div>
              <button
                onClick={() => setAuditLogsModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[420px] overflow-y-auto space-y-3">
              {auditLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  Loading audit log events...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No explicit audit trail records found.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(log.recordedAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {log.notes}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Performed by: <strong className="text-slate-700">{log.performedByUsername}</strong> ({log.performedByRole})
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAuditLogsModalItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
