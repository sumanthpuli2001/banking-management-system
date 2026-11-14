import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ApiResponse } from '../types/auth';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  FileCheck,
  ArrowRight,
  X
} from 'lucide-react';

interface ApprovalRequestItem {
  id: number;
  requestType: string;
  referenceId: string;
  makerUsername: string;
  makerName: string;
  checkerUsername?: string;
  checkerName?: string;
  branchName: string;
  amount?: number;
  status: string;
  makerRemarks: string;
  checkerRemarks?: string;
  createdAt: string;
  decidedAt?: string;
}

export const ApprovalCenterPage: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Decision Modal
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
      const res = await api.get<ApiResponse<{ content: ApprovalRequestItem[] }>>('/approvals/pending?size=50');
      if (res.data?.success && res.data.data?.content) {
        setApprovals(res.data.data.content);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (item: ApprovalRequestItem) => {
    setSelectedRequest(item);
    setDecision('APPROVE');
    setRemarks(item.status === 'PENDING' ? 'Authorized under branch discretionary limits.' : '');
    setDecisionError('');
  };

  const handleProcessDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!remarks.trim()) {
      setDecisionError('Reviewer remarks are mandatory for audit compliance.');
      return;
    }

    // Segregation of duties validation
    if (user && selectedRequest.makerUsername.toLowerCase() === user.username.toLowerCase()) {
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

  const filtered = approvals.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      item.requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.makerUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.makerRemarks?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>Governance & Dual Authorization</span>
            <span>•</span>
            <span>Maker-Checker Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-400" />
            Centralized Dual-Control Approval Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mandatory segregation of duties for high-value fund transfers, credit sanctions, and account status alterations.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-2 border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Segregation of Duties Banner */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-300">
        <UserCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-200">RBI Regulatory Compliance Mandate (Segregation of Duties):</span>
          <p className="mt-1 text-amber-300/80 leading-relaxed">
            Every high-risk financial transaction (&gt; ₹5,00,000) or administrative action must be initiated by an authorized <strong>Maker</strong> and verified by an independent <strong>Checker</strong>.
            Self-approval is strictly prevented by cryptographic user hash enforcement.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Pending Authorizations</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting checker sign-off</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Approved Today</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Disbursed & settled</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Rejected / Blocked</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{rejectedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Returned with remarks</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Active Checker Role</div>
          <div className="text-base font-bold text-white mt-1.5">{user?.roles?.[0] || 'BRANCH_MANAGER'}</div>
          <div className="text-[11px] text-blue-400 mt-0.5">{user?.fullName}</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ref #, maker, or type..."
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading maker-checker requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No requests found in this queue.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{item.requestType}</div>
                      <div className="font-mono text-blue-400 text-[11px] mt-0.5">
                        {item.referenceId}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                      {item.amount ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">{item.makerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">@{item.makerUsername} • {item.branchName}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-slate-400">
                      {item.makerRemarks || 'Standard procedural request'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px] font-mono">
                      {new Date(item.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                            : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => handleOpenDecisionModal(item)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <FileCheck className="h-3.5 w-3.5" /> Review & Authorize
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDecisionModal(item)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition-all"
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
      </div>

      {/* Decision Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Maker-Checker Authorization Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessDecision} className="p-6 space-y-4">
              {decisionError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-4 py-2.5 rounded-lg text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{decisionError}</span>
                </div>
              )}

              {/* Segregation Warning if Maker is current User */}
              {user && selectedRequest.makerUsername.toLowerCase() === user.username.toLowerCase() && (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 text-xs text-rose-300">
                  <strong>Segregation of Duties Alert:</strong> You are the Maker of this request (@{selectedRequest.makerUsername}). You cannot sign off as Checker.
                </div>
              )}

              {/* Request Dossier */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="font-bold text-white">{selectedRequest.requestType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref ID:</span>
                  <span className="text-blue-400">{selectedRequest.referenceId}</span>
                </div>
                {selectedRequest.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Value:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      ₹{selectedRequest.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Maker:</span>
                  <span className="text-slate-300">{selectedRequest.makerName} (@{selectedRequest.makerUsername})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="text-slate-300">{selectedRequest.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maker Narration:</span>
                  <span className="text-slate-300 font-sans italic">{selectedRequest.makerRemarks}</span>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' ? (
                <>
                  {/* Decision Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Checker Decision
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDecision('APPROVE')}
                        className={`p-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          decision === 'APPROVE'
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" /> AUTHORIZE / APPROVE
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('REJECT')}
                        className={`p-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          decision === 'REJECT'
                            ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <XCircle className="h-4 w-4" /> REJECT / RETURN
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Checker Audit Remarks <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Mandatory compliance remarks explaining decision..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || (user?.username.toLowerCase() === selectedRequest.makerUsername.toLowerCase())}
                      className={`px-5 py-2 font-bold text-xs rounded-lg text-white shadow-lg transition-all ${
                        decision === 'APPROVE'
                          ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50'
                          : 'bg-rose-600 hover:bg-rose-500 disabled:opacity-50'
                      }`}
                    >
                      {isSubmitting ? 'Recording Decision...' : `Submit ${decision} Decision`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-400 font-bold uppercase tracking-wider">Recorded Checker Decision</div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                    <div>Status: <span className="font-bold text-white">{selectedRequest.status}</span></div>
                    <div>Checker: <span className="font-bold text-blue-400">{selectedRequest.checkerName || selectedRequest.checkerUsername}</span></div>
                    <div>Remarks: <span className="italic">{selectedRequest.checkerRemarks || 'None recorded'}</span></div>
                    <div>Timestamp: <span className="font-mono text-slate-400">{selectedRequest.decidedAt ? new Date(selectedRequest.decidedAt).toLocaleString('en-IN') : '—'}</span></div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                    >
                      Close
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
export default ApprovalCenterPage;
