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
  FileCheck,
  X
} from 'lucide-react';

interface ApprovalRequestItem {
  id: number;
  requestType: string;
  referenceId?: string;
  makerId?: number;
  makerUsername?: string;
  makerName: string;
  makerRole?: string;
  checkerId?: number;
  checkerUsername?: string;
  checkerName?: string;
  branchId?: number;
  branchName: string;
  amount?: number;
  status: string;
  makerRemarks?: string;
  checkerRemarks?: string;
  requestedAt?: string;
  createdAt?: string;
  decidedAt?: string;
}

export const ApprovalCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [decisionError, setDecisionError] = useState<string>('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: ApprovalRequestItem[] }>>('/approvals/pending?size=100');
      if (res.data?.success && res.data.data?.content) {
        setApprovals(res.data.data.content);
      }
    } catch {
      // Fallback: keep existing approvals
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (item: ApprovalRequestItem) => {
    setSelectedRequest(item);
    setDecision('APPROVE');
    setRemarks(item.status === 'PENDING' ? 'Authorized under institutional discretionary limits.' : '');
    setDecisionError('');
  };

  const isSelfMaker = (req: ApprovalRequestItem | null): boolean => {
    if (!req || !user?.username) return false;
    const maker = req.makerUsername || '';
    if (!maker) return false;
    return maker.toLowerCase() === user.username.toLowerCase();
  };

  const handleProcessDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!remarks.trim()) {
      setDecisionError('Checker compliance remarks are mandatory for audit trails.');
      return;
    }

    if (isSelfMaker(selectedRequest)) {
      setDecisionError('Dual-Control Segregation Violation: Maker cannot authorize their own request.');
      return;
    }

    setIsSubmitting(true);
    setDecisionError('');
    try {
      const res = await api.post(`/approvals/${selectedRequest.id}/decide`, {
        decision,
        remarks,
      });

      if (res.data?.success) {
        setSelectedRequest(null);
        fetchApprovals();
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

  const filtered = approvals.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (item.requestType || '').toLowerCase().includes(sTerm) ||
      (item.referenceId || '').toLowerCase().includes(sTerm) ||
      (item.makerName || '').toLowerCase().includes(sTerm) ||
      (item.makerRemarks || '').toLowerCase().includes(sTerm);
    return matchesStatus && matchesSearch;
  });

  const paginatedItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Governance & Dual Authorization</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Maker-Checker Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-emerald-600 shrink-0" />
            Centralized Dual-Control Approval Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory segregation of duties for high-value fund transfers, credit sanctions, and account alterations.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Metric Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pending Authorization</p>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-sans">{pendingCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Awaiting checker sign-off</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Approved Today</p>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-sans">{approvedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Disbursed & settled</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Rejected / Blocked</p>
          <p className="text-2xl font-black text-rose-700 mt-1 font-sans">{rejectedCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Returned with remarks</span>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
          <p className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Active Checker Role</p>
          <p className="text-lg font-black text-white mt-1 font-sans truncate">{user?.roles?.[0] || 'CHECKER'}</p>
          <span className="text-[10px] text-slate-400 truncate block">{user?.fullName}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/70">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ref #, maker, or type..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm font-sans"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Ref ID / Request Type</th>
                <th className="px-5 py-3.5">Amount (₹)</th>
                <th className="px-5 py-3.5">Maker Details</th>
                <th className="px-5 py-3.5">Remarks / Reason</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Checker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading maker-checker requests...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No requests found in this queue.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs font-mono">{item.requestType}</div>
                      <div className="font-mono text-emerald-700 text-[11px] mt-0.5">
                        {item.referenceId || `REQ-${item.id}`}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 text-xs">
                      {item.amount ? `₹${Number(item.amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.makerName || 'Bank Officer'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.makerRole || 'MAKER'} • {item.branchName || 'Branch Node'}
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-slate-600">
                      {item.makerRemarks || 'Standard procedural request'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-[11px] font-mono">
                      {formatDate(item.requestedAt || item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-teal-50 text-teal-900 border border-teal-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenDecisionModal(item)}
                          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FileCheck className="h-3.5 w-3.5 text-emerald-300" /> Review & Authorize
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDecisionModal(item)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-all font-semibold"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Decision Modal (Crash-Proof) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm font-sans">Maker-Checker Authorization Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessDecision} className="p-6 space-y-4">
              {decisionError && (
                <div className="flex items-center gap-2 text-rose-800 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{decisionError}</span>
                </div>
              )}

              {/* Segregation Warning */}
              {isSelfMaker(selectedRequest) && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                  <strong>Segregation of Duties Alert:</strong> You are the Maker of this request. Checker dual-control policy requires an independent officer to sign off.
                </div>
              )}

              {/* Request Dossier */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="font-bold text-slate-900">{selectedRequest.requestType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref ID:</span>
                  <span className="text-emerald-800 font-bold">{selectedRequest.referenceId || `REQ-${selectedRequest.id}`}</span>
                </div>
                {selectedRequest.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Value:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      ₹{Number(selectedRequest.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Maker:</span>
                  <span className="text-slate-800 font-semibold">{selectedRequest.makerName || 'Bank Employee'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="text-slate-800">{selectedRequest.branchName || 'Central'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maker Narration:</span>
                  <span className="text-slate-700 font-sans italic">{selectedRequest.makerRemarks || 'Procedural request'}</span>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                      Checker Decision
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecision('APPROVE')}
                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          decision === 'APPROVE'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> AUTHORIZE / APPROVE
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('REJECT')}
                        className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          decision === 'REJECT'
                            ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <XCircle className="h-4 w-4 text-rose-600" /> REJECT / RETURN
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                      Checker Compliance Remarks <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Mandatory compliance remarks explaining decision..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isSelfMaker(selectedRequest)}
                      className={`px-5 py-2.5 font-bold text-xs rounded-xl text-white shadow-md transition-all ${
                        decision === 'APPROVE'
                          ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
                          : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                      }`}
                    >
                      {isSubmitting ? 'Recording Decision...' : `Submit ${decision} Decision`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="text-slate-500 font-bold uppercase tracking-wider font-mono">Recorded Checker Decision</div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1.5 font-mono">
                    <div>Status: <span className="font-bold text-slate-900">{selectedRequest.status}</span></div>
                    <div>Checker: <span className="font-bold text-emerald-800">{selectedRequest.checkerName || 'Authorized Officer'}</span></div>
                    <div>Remarks: <span className="italic font-sans">{selectedRequest.checkerRemarks || 'None recorded'}</span></div>
                    <div>Timestamp: <span className="text-slate-500">{formatDate(selectedRequest.decidedAt)}</span></div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
