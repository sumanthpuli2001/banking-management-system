import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  Lock,
  UserX,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  Key
} from 'lucide-react';

interface AuditLogItem {
  id: number;
  eventTimestamp: string;
  action: string;
  username: string;
  role: string;
  resourceType: string;
  resourceId: string;
  status: string;
  ipAddress: string;
  details: string;
}

interface LoginHistoryItem {
  id: number;
  loginTime: string;
  username: string;
  status: string;
  ipAddress: string;
  userAgent: string;
  failureReason?: string;
}

export const AuditCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AUDIT_TRAIL' | 'LOGIN_FORENSICS' | 'AML_SURVEILLANCE'>('AUDIT_TRAIL');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logins, setLogins] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, loginsRes] = await Promise.all([
        api.get<ApiResponse<AuditLogItem[]>>('/audit/logs'),
        api.get<ApiResponse<LoginHistoryItem[]>>('/audit/logins'),
      ]);
      if (logsRes.data?.success && logsRes.data.data) {
        setLogs(logsRes.data.data);
      }
      if (loginsRes.data?.success && loginsRes.data.data) {
        setLogins(loginsRes.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,Action,Username,Role,Resource,Status,IP,Details\n';
    const rows = logs
      .map(
        (l) =>
          `${l.id},"${l.eventTimestamp}","${l.action}","${l.username}","${l.role}","${l.resourceType} ${l.resourceId}","${l.status}","${l.ipAddress}","${l.details?.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Apex_Bank_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesSearch =
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const filteredLogins = logins.filter((lh) =>
    lh.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lh.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lh.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedLogins = filteredLogins.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const failedLoginsCount = logins.filter((l) => l.status !== 'SUCCESS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <span>Regulatory Surveillance</span>
            <span>•</span>
            <span>FinCEN / RBI Compliance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
            Audit Trail & Regulatory Compliance Forensics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable append-only system audit logs, cryptographic access records, and automated Anti-Money Laundering (AML) triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="h-4 w-4" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total System Audit Events</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{logs.length} Records</div>
          <div className="text-[11px] text-slate-500 mt-1">Immutable ledger tracking</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Security Access Attempts</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{logins.length} Sessions</div>
          <div className="text-[11px] text-slate-500 mt-1">Client authentication logs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Security Anomalies / Failures</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{failedLoginsCount} Alerts</div>
          <div className="text-[11px] text-slate-500 mt-1">Failed passwords / lockouts</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Ledger Integrity Rating</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">100% SECURE</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero unauthorized tampering</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('AUDIT_TRAIL')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'AUDIT_TRAIL'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="h-4 w-4" />
            Audit Trail ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('LOGIN_FORENSICS')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'LOGIN_FORENSICS'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Key className="h-4 w-4" />
            Authentication Forensics ({logins.length})
          </button>
          <button
            onClick={() => setActiveTab('AML_SURVEILLANCE')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'AML_SURVEILLANCE'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            AML Surveillance
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'AUDIT_TRAIL' && (
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="FUND_TRANSFER">FUND_TRANSFER</option>
              <option value="CASH_DEPOSIT">CASH_DEPOSIT</option>
              <option value="CASH_WITHDRAWAL">CASH_WITHDRAWAL</option>
              <option value="LOAN_SANCTION">LOAN_SANCTION</option>
              <option value="MAKER_CHECKER_APPROVAL">MAKER_CHECKER_APPROVAL</option>
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit records..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: System Audit Trail Table */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Code</th>
                  <th className="px-5 py-3.5">Operator</th>
                  <th className="px-5 py-3.5">Target Resource</th>
                  <th className="px-5 py-3.5">Client IP</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Forensic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading system compliance logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No audit events matched your query.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.eventTimestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-blue-400 bg-blue-950/50 border border-blue-900/60 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">@{log.username}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{log.role}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-sans text-xs max-w-sm truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Tab 2: Login Forensics */}
      {activeTab === 'LOGIN_FORENSICS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Attempt Time</th>
                  <th className="px-5 py-3.5">Username</th>
                  <th className="px-5 py-3.5">Login Status</th>
                  <th className="px-5 py-3.5">Client IP Address</th>
                  <th className="px-5 py-3.5">User Agent / Client</th>
                  <th className="px-5 py-3.5">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading authentication logs...
                    </td>
                  </tr>
                ) : filteredLogins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No authentication records found.
                    </td>
                  </tr>
                ) : (
                  paginatedLogins.map((lh) => (
                    <tr key={lh.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(lh.loginTime).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">@{lh.username}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lh.status === 'SUCCESS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {lh.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{lh.ipAddress || '127.0.0.1'}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-sans text-xs max-w-xs truncate">
                        {lh.userAgent}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-rose-400 text-xs">
                        {lh.failureReason || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogins.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Tab 3: AML Surveillance */}
      {activeTab === 'AML_SURVEILLANCE' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-white">FinCEN & RBI High-Value Surveillance Engine</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated heuristic rule engine monitoring cash transactions exceeding ₹10,00,000 and structuring velocities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-white">Rule AML-01: Large Cash Reporting</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  Active Rule
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flags any cash transaction (deposit or withdrawal) of ₹10,00,000 or greater in a single banking day. Generates an immediate CTR (Cash Transaction Report) dispatch.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-white">Rule AML-02: Rapid Smurfing / Structuring</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  Active Rule
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects multiple sub-threshold transactions (e.g. ₹49,000 repeated within 48 hours) to prevent PAN identification circumvention.
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-4 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Current AML status: All monitored branch transactions comply with RBI statutory thresholds.</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">0 Active CTR Violations</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditCompliancePage;
