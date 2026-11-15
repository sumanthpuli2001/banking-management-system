import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  X,
  Sliders,
  Send,
  UserCheck,
  UserX,
  History,
  FileText,
  BadgeAlert,
  ExternalLink,
  Info
} from 'lucide-react';

interface AmlCaseNote {
  id: number;
  alertId: number;
  authorUsername: string;
  actionTaken: string;
  noteText: string;
  isConfidential: boolean;
  recordedAt: string;
}

interface AmlAlertItem {
  id: number;
  alertNumber: string;
  ruleCode: string;
  ruleName: string;
  severity: string; // LOW, MEDIUM, HIGH, CRITICAL
  status: string; // NEW_ALERT, UNDER_INVESTIGATION, ESCALATED_TO_MLRO, STR_FILED, CLOSED_FALSE_POSITIVE, CLOSED_EXPLAINED
  customerId: number;
  customerNumber: string;
  customerName: string;
  customerRiskCategory: string;
  accountNumber: string;
  transactionReference: string;
  transactionAmount: number;
  transactionType: string;
  detectionScore: number;
  triggerDetails: string;
  assignedOfficer: string;
  fiuStrReference?: string;
  detectedTimestamp: string;
  escalatedTimestamp?: string;
  closedTimestamp?: string;
  closureReason?: string;
  notes?: AmlCaseNote[];
}

interface CustomerKycProfileItem {
  id: number;
  customerId: number;
  customerNumber: string;
  customerName: string;
  panNumber?: string;
  aadhaarNumber?: string;
  cddStatus: string;
  panVerificationStatus: string;
  panVerificationSource: string;
  aadhaarVerificationStatus: string;
  aadhaarVerificationSource: string;
  addressVerificationStatus: string;
  isPep: boolean;
  riskCategory: string;
  lastKycReviewDate?: string;
  nextKycReviewDueDate?: string;
  documentExpiryDate?: string;
  eddStatus: string; // NOT_REQUIRED, PENDING_REVIEW, APPROVED, REJECTED
  eddSourceOfWealth?: string;
  eddBeneficialOwnership?: string;
  eddApprovedBy?: string;
  eddApprovedAt?: string;
  kycNotes?: string;
  overdue: boolean;
}

interface AmlRuleConfigItem {
  id: number;
  ruleCode: string;
  ruleName: string;
  severity: string;
  thresholdAmount: number;
  lookbackHours: number;
  multiplier: number;
  description: string;
  isActive: boolean;
  isRegulatoryReportRequired: boolean;
  statutoryReference: string;
  updatedByOfficer: string;
}

interface ComplianceSummary {
  totalAlerts: number;
  newAlerts: number;
  underInvestigation: number;
  escalatedMlro: number;
  strFiled: number;
  closedCases: number;
  highSeverityAlerts: number;
  overdueKycReviews: number;
  pendingEddReviews: number;
}

export const ComplianceAmlPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'KYC' | 'RULES' | 'FIU_REGISTER'>('ALERTS');
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ComplianceSummary>({
    totalAlerts: 0,
    newAlerts: 0,
    underInvestigation: 0,
    escalatedMlro: 0,
    strFiled: 0,
    closedCases: 0,
    highSeverityAlerts: 0,
    overdueKycReviews: 0,
    pendingEddReviews: 0,
  });

  // AML Alerts State
  const [alerts, setAlerts] = useState<AmlAlertItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalAlertsCount, setTotalAlertsCount] = useState<number>(0);

  // Alert Dossier Modal
  const [selectedAlert, setSelectedAlert] = useState<AmlAlertItem | null>(null);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  // KYC Exceptions State
  const [kycExceptions, setKycExceptions] = useState<CustomerKycProfileItem[]>([]);
  const [kycFilter, setKycFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING_EDD'>('ALL');
  const [selectedEddCustomer, setSelectedEddCustomer] = useState<CustomerKycProfileItem | null>(null);
  const [eddSourceOfWealth, setEddSourceOfWealth] = useState<string>('');
  const [eddBeneficialOwnership, setEddBeneficialOwnership] = useState<string>('');
  const [eddRemarks, setEddRemarks] = useState<string>('');

  // Risk Reclassification Modal
  const [reclassifyCustomer, setReclassifyCustomer] = useState<CustomerKycProfileItem | null>(null);
  const [selectedNewRisk, setSelectedNewRisk] = useState<string>('HIGH');

  // Rules State
  const [rules, setRules] = useState<AmlRuleConfigItem[]>([]);
  const [selectedRuleToEdit, setSelectedRuleToEdit] = useState<AmlRuleConfigItem | null>(null);
  const [ruleThresholdInput, setRuleThresholdInput] = useState<number>(1000000);
  const [ruleLookbackInput, setRuleLookbackInput] = useState<number>(24);

  useEffect(() => {
    fetchSummary();
    if (activeTab === 'ALERTS' || activeTab === 'FIU_REGISTER') fetchAlerts();
    if (activeTab === 'KYC') fetchKycExceptions();
    if (activeTab === 'RULES') fetchRules();
  }, [activeTab, statusFilter, severityFilter, currentPage, pageSize]);

  const fetchSummary = async () => {
    try {
      const res = await api.get<ApiResponse<ComplianceSummary>>('/compliance/summary');
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      }
    } catch {
      // Fallback summary
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: String(pageSize),
      });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);

      const res = await api.get<ApiResponse<{ content: AmlAlertItem[]; totalElements: number }>>(
        `/compliance/alerts?${params.toString()}`
      );
      if (res.data?.success && res.data.data) {
        setAlerts(res.data.data.content || []);
        setTotalAlertsCount(res.data.data.totalElements || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchKycExceptions = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: CustomerKycProfileItem[] }>>(
        '/compliance/kyc/exceptions?size=50'
      );
      if (res.data?.success && res.data.data?.content) {
        setKycExceptions(res.data.data.content);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<AmlRuleConfigItem[]>>('/compliance/rules');
      if (res.data?.success && res.data.data) {
        setRules(res.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAlertDossier = async (alert: AmlAlertItem) => {
    setSelectedAlert(alert);
    setNewNoteText('');
    setActionError('');
    try {
      const res = await api.get<ApiResponse<AmlAlertItem>>(`/compliance/alerts/${alert.id}`);
      if (res.data?.success && res.data.data) {
        setSelectedAlert(res.data.data);
      }
    } catch {
      // Fallback to local
    }
  };

  const handleProcessCaseAction = async (action: string, customNote?: string, fiuRef?: string) => {
    if (!selectedAlert) return;
    setIsSubmittingAction(true);
    setActionError('');
    try {
      const res = await api.post<ApiResponse<AmlAlertItem>>(`/compliance/alerts/${selectedAlert.id}/action`, {
        action,
        note: customNote || `Action ${action} initiated by compliance team.`,
        fiuStrReference: fiuRef,
      });

      if (res.data?.success && res.data.data) {
        setSelectedAlert(res.data.data);
        fetchAlerts();
        fetchSummary();
      } else {
        setActionError(res.data?.message || 'Failed to process case action');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error processing case action');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddCaseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !newNoteText.trim()) return;

    try {
      const res = await api.post(`/compliance/alerts/${selectedAlert.id}/notes?noteText=${encodeURIComponent(newNoteText)}`);
      if (res.data?.success) {
        setNewNoteText('');
        handleOpenAlertDossier(selectedAlert);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record case note');
    }
  };

  const handleEddDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedEddCustomer) return;
    try {
      await api.post(`/compliance/kyc/customers/${selectedEddCustomer.customerId}/edd`, {
        decision,
        sourceOfWealth: eddSourceOfWealth || 'Documented business proceeds and dividend distributions',
        beneficialOwnership: eddBeneficialOwnership || '100% Sole Ultimate Beneficial Owner (UBO)',
        remarks: eddRemarks || `Senior Compliance sign-off: EDD ${decision} based on documentary verification.`,
      });
      setSelectedEddCustomer(null);
      fetchKycExceptions();
      fetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording EDD review');
    }
  };

  const handleReclassifyRisk = async () => {
    if (!reclassifyCustomer) return;
    try {
      await api.put(`/compliance/kyc/customers/${reclassifyCustomer.customerId}/risk?riskCategory=${selectedNewRisk}`);
      setReclassifyCustomer(null);
      fetchKycExceptions();
      fetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update customer risk classification');
    }
  };

  const handleSaveRuleConfig = async () => {
    if (!selectedRuleToEdit) return;
    try {
      await api.put(`/compliance/rules/${selectedRuleToEdit.ruleCode}`, {
        thresholdAmount: ruleThresholdInput,
        lookbackHours: ruleLookbackInput,
      });
      setSelectedRuleToEdit(null);
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update rule');
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW_ALERT':
        return 'bg-rose-100/80 text-rose-900 border-rose-300 font-bold';
      case 'UNDER_INVESTIGATION':
        return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
      case 'ESCALATED_TO_MLRO':
        return 'bg-purple-50 text-purple-900 border-purple-300 font-bold';
      case 'STR_FILED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'CLOSED_FALSE_POSITIVE':
      case 'CLOSED_EXPLAINED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredKycExceptions = kycExceptions.filter((item) => {
    if (kycFilter === 'OVERDUE') return item.overdue;
    if (kycFilter === 'PENDING_EDD') return item.eddStatus === 'PENDING_REVIEW';
    return true;
  });

  const fiuFilingAlerts = alerts.filter((a) => a.status === 'STR_FILED' || a.fiuStrReference);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Governance & Statutory Surveillance</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">PMLA 2002 & FIU-IND Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-emerald-700 shrink-0" />
            AML Surveillance & Advanced KYC Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated red-flag pattern surveillance, cash structuring detection, customer due diligence (CDD) and Enhanced Due Diligence (EDD) governance.
          </p>
        </div>

        <button
          onClick={() => {
            fetchSummary();
            if (activeTab === 'ALERTS') fetchAlerts();
            if (activeTab === 'KYC') fetchKycExceptions();
            if (activeTab === 'RULES') fetchRules();
          }}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} /> Refresh Pipeline
        </button>
      </div>

      {/* Statutory Regulatory Mode Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-950 font-mono uppercase tracking-wide">
              Statutory Compliance Sandbox Mode Active
            </span>
            <p className="text-slate-600 mt-0.5">
              Government verification services (UIDAI Aadhaar / NSDL PAN) and FIU-IND STR/CTR filings are simulated in development sandbox. No real external government filings are transmitted without live production certificates.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-800 text-emerald-100 rounded-full font-mono font-bold text-[10px] tracking-wider shrink-0">
          DEMO / SIMULATED
        </span>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Active AML Alerts</p>
          <p className="text-2xl font-black text-rose-700 mt-1 font-sans">
            {summary.newAlerts + summary.underInvestigation}
          </p>
          <span className="text-[10px] text-rose-600 font-medium font-mono">
            {summary.highSeverityAlerts} Critical / High Severity
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Escalated to MLRO</p>
          <p className="text-2xl font-black text-purple-800 mt-1 font-sans">
            {summary.escalatedMlro}
          </p>
          <span className="text-[10px] text-purple-700 font-medium">Under Officer Deliberation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Statutory STRs Filed</p>
          <p className="text-2xl font-black text-emerald-800 mt-1 font-sans">
            {summary.strFiled}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium font-mono">FIU-IND Submissions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">KYC Overdue & EDD</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-sans">
            {summary.overdueKycReviews + summary.pendingEddReviews}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">
            {summary.pendingEddReviews} Pending Senior EDD
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ALERTS'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BadgeAlert className="h-4 w-4" />
          AML Surveillance & Alert Queue
          {summary.newAlerts > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-mono">
              {summary.newAlerts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('KYC')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'KYC'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          KYC Exception Queue & EDD
          {summary.pendingEddReviews > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded-full text-[10px] font-mono">
              {summary.pendingEddReviews}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'RULES'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Configurable Detection Rules
        </button>

        <button
          onClick={() => setActiveTab('FIU_REGISTER')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'FIU_REGISTER'
              ? 'border-emerald-600 text-emerald-800 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          FIU-IND Filing Register
        </button>
      </div>

      {/* TAB 1: AML SURVEILLANCE & ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['ALL', 'NEW_ALERT', 'UNDER_INVESTIGATION', 'ESCALATED_TO_MLRO', 'STR_FILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alert #, customer or account..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Alerts Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Alert # / Severity</th>
                    <th className="px-5 py-3.5">Trigger Rule</th>
                    <th className="px-5 py-3.5">Customer & Account</th>
                    <th className="px-5 py-3.5">Txn Amount</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Case Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading AML surveillance queue...
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No AML alerts matching the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    alerts
                      .filter((a) => {
                        const s = searchTerm.toLowerCase();
                        return (
                          !s ||
                          a.alertNumber.toLowerCase().includes(s) ||
                          a.customerName.toLowerCase().includes(s) ||
                          a.customerNumber.toLowerCase().includes(s) ||
                          a.accountNumber.includes(s)
                        );
                      })
                      .map((alert) => (
                        <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 font-mono text-xs">{alert.alertNumber}</div>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getSeverityBadge(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <div className="font-bold text-slate-900 text-xs">{alert.ruleName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{alert.ruleCode}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">{alert.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {alert.customerNumber} • A/C: {alert.accountNumber}
                            </div>
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                              Risk: {alert.customerRiskCategory}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-900 text-xs">
                            ₹{Number(alert.transactionAmount).toLocaleString('en-IN')}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">
                              {alert.transactionType}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-xs ${
                                alert.detectionScore >= 85
                                  ? 'bg-rose-100 text-rose-800'
                                  : alert.detectionScore >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {alert.detectionScore}/100
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] border ${getStatusBadge(
                                alert.status
                              )}`}
                            >
                              {alert.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleOpenAlertDossier(alert)}
                              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <FileCheck className="h-3.5 w-3.5 text-emerald-300" /> Case Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={totalAlertsCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {/* TAB 2: KYC EXCEPTION QUEUE & EDD HUB */}
      {activeTab === 'KYC' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setKycFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  kycFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                All Exceptions
              </button>
              <button
                onClick={() => setKycFilter('OVERDUE')}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  kycFilter === 'OVERDUE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Overdue Periodic Reviews
              </button>
              <button
                onClick={() => setKycFilter('PENDING_EDD')}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  kycFilter === 'PENDING_EDD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Pending Senior EDD Sign-Off
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Customer CIF & Name</th>
                    <th className="px-5 py-3.5">Risk Rating</th>
                    <th className="px-5 py-3.5">CDD Verification Status</th>
                    <th className="px-5 py-3.5">Periodic Review Due</th>
                    <th className="px-5 py-3.5">EDD Status</th>
                    <th className="px-5 py-3.5 text-right">Compliance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading KYC exceptions...
                      </td>
                    </tr>
                  ) : filteredKycExceptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                        No pending KYC exceptions or overdue reviews detected.
                      </td>
                    </tr>
                  ) : (
                    filteredKycExceptions.map((kyc) => (
                      <tr key={kyc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-xs font-mono">{kyc.customerNumber}</div>
                          <div className="font-bold text-slate-800 mt-0.5">{kyc.customerName}</div>
                          {kyc.isPep && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded font-mono">
                              POLITICALLY EXPOSED PERSON (PEP)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                              kyc.riskCategory === 'HIGH' || kyc.riskCategory === 'PEP'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : kyc.riskCategory === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {kyc.riskCategory} RISK
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono">
                          <div className="text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> PAN: {kyc.panVerificationStatus}
                          </div>
                          <div className="text-emerald-800 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> UIDAI: {kyc.aadhaarVerificationStatus}
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans block mt-1">
                            Sandbox Sandbox Verification
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">
                          <span className={kyc.overdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                            {kyc.nextKycReviewDueDate || '2026-12-31'}
                          </span>
                          {kyc.overdue && (
                            <span className="block text-[10px] text-rose-600 font-bold uppercase font-mono">
                              OVERDUE REVIEW
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                              kyc.eddStatus === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : kyc.eddStatus === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {kyc.eddStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          {kyc.eddStatus === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => {
                                setSelectedEddCustomer(kyc);
                                setEddSourceOfWealth(kyc.eddSourceOfWealth || '');
                                setEddBeneficialOwnership(kyc.eddBeneficialOwnership || '');
                                setEddRemarks('');
                              }}
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                            >
                              Review EDD
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReclassifyCustomer(kyc);
                              setSelectedNewRisk(kyc.riskCategory);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                          >
                            Reclassify Risk
                          </button>
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

      {/* TAB 3: CONFIGURABLE AML RULES ENGINE */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                  Active Transaction Surveillance Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic statutory and operational parameters executed against every cash counter transaction and digital fund transfer.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Rule Code & Name</th>
                    <th className="px-5 py-3.5">Severity</th>
                    <th className="px-5 py-3.5">Threshold Amount</th>
                    <th className="px-5 py-3.5">Lookback Window</th>
                    <th className="px-5 py-3.5">Statutory Reference</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Configure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{rule.ruleName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{rule.ruleCode}</div>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">{rule.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(
                            rule.severity
                          )}`}
                        >
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 text-xs">
                        ₹{Number(rule.thresholdAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        {rule.lookbackHours} hours
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-emerald-800">
                        {rule.statutoryReference}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px] font-mono">
                          ACTIVE
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRuleToEdit(rule);
                            setRuleThresholdInput(rule.thresholdAmount);
                            setRuleLookbackInput(rule.lookbackHours);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Adjust Limits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FIU-IND STATUTORY FILING REGISTER */}
      {activeTab === 'FIU_REGISTER' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">
                  Official FIU-IND Suspicious Transaction Report (STR) Filing Register
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory reporting audit trail under Section 12 of Prevention of Money Laundering Act (PMLA) 2002.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-mono text-xs font-bold">
                Total STR Filings: {fiuFilingAlerts.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">FIU-IND Filing Reference</th>
                    <th className="px-5 py-3.5">Internal Alert #</th>
                    <th className="px-5 py-3.5">Customer & Account</th>
                    <th className="px-5 py-3.5">Reported Amount</th>
                    <th className="px-5 py-3.5">Filing Status</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono">
                  {fiuFilingAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-sans">
                        No statutory STR filings submitted yet. Escalate an alert and select "File Statutory STR" to record an official filing.
                      </td>
                    </tr>
                  ) : (
                    fiuFilingAlerts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="font-bold text-emerald-800 text-xs">
                            {item.fiuStrReference || `FIU-IND-STR-2026-${item.id}`}
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans">PMLA Sec 12 Regulated</span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{item.alertNumber}</td>
                        <td className="px-5 py-4">
                          <div className="text-slate-900 font-bold">{item.customerName}</div>
                          <div className="text-slate-500 text-[11px]">{item.customerNumber} • A/C {item.accountNumber}</div>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          ₹{Number(item.transactionAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[10px]">
                            FILED_CONFIRMED
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-[11px]">
                          {item.detectedTimestamp?.substring(0, 16).replace('T', ' ')}
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

      {/* ALERT DOSSIER MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm font-sans flex items-center gap-2">
                    AML Surveillance Dossier: {selectedAlert.alertNumber}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadge(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Detection Score: {selectedAlert.detectionScore}/100 • Status: {selectedAlert.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Transaction & Customer Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Triggered Rule:</span>
                  <span className="font-bold text-slate-900">{selectedAlert.ruleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer CIF & Name:</span>
                  <span className="font-semibold text-slate-800">{selectedAlert.customerNumber} • {selectedAlert.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="text-slate-800 font-bold">{selectedAlert.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Reference:</span>
                  <span className="text-emerald-800 font-bold">{selectedAlert.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Value:</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{Number(selectedAlert.transactionAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Trigger Details:</span>
                  <span className="text-slate-700 font-sans text-right max-w-sm">{selectedAlert.triggerDetails}</span>
                </div>
                {selectedAlert.fiuStrReference && (
                  <div className="flex justify-between bg-emerald-100/60 p-2 rounded-lg border border-emerald-300">
                    <span className="text-emerald-900 font-bold">FIU-IND STR Filing:</span>
                    <span className="text-emerald-950 font-bold">{selectedAlert.fiuStrReference}</span>
                  </div>
                )}
              </div>

              {/* Case Action Workflow Buttons */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Compliance Officer Determination
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedAlert.status === 'NEW_ALERT' && (
                    <button
                      onClick={() => handleProcessCaseAction('INVESTIGATE', 'Compliance officer initiated formal transaction investigation.')}
                      disabled={isSubmittingAction}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Start Investigation
                    </button>
                  )}

                  {selectedAlert.status !== 'STR_FILED' && selectedAlert.status !== 'ESCALATED_TO_MLRO' && (
                    <button
                      onClick={() => handleProcessCaseAction('ESCALATE_MLRO', 'Escalated to MLRO for suspicious pattern determination.')}
                      disabled={isSubmittingAction}
                      className="px-3 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Escalate to MLRO
                    </button>
                  )}

                  {selectedAlert.status !== 'STR_FILED' && (
                    <button
                      onClick={() => handleProcessCaseAction('FILE_STR', 'Statutory Suspicious Transaction Report (STR) filed to FIU-IND.')}
                      disabled={isSubmittingAction}
                      className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5 text-emerald-300" /> File Statutory STR
                    </button>
                  )}

                  {!selectedAlert.status.startsWith('CLOSED') && selectedAlert.status !== 'STR_FILED' && (
                    <>
                      <button
                        onClick={() => handleProcessCaseAction('CLOSE_EXPLAINED', 'Verified legitimate commercial explanation with supporting invoices.')}
                        disabled={isSubmittingAction}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Close: Explained
                      </button>
                      <button
                        onClick={() => handleProcessCaseAction('CLOSE_FALSE_POSITIVE', 'Rule trigger evaluated as system false positive.')}
                        disabled={isSubmittingAction}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200"
                      >
                        Close: False Positive
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Case Audit Notes Timeline */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-600" />
                  Investigation Case Notes & Audit Trail
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedAlert.notes && selectedAlert.notes.length > 0 ? (
                    selectedAlert.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span className="font-bold text-slate-700">{note.authorUsername}</span>
                          <span>{note.recordedAt?.substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <span className="inline-block px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[9px] font-mono font-bold mr-1.5">
                          {note.actionTaken}
                        </span>
                        <span className="text-slate-700 font-sans">{note.noteText}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddCaseNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter compliance finding, client interview notes, or source of funds remarks..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDD REVIEW MODAL */}
      {selectedEddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <UserCheck className="h-5 w-5 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-sm font-sans">
                  Enhanced Due Diligence (EDD) Approval Dossier
                </h3>
              </div>
              <button onClick={() => setSelectedEddCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono space-y-1">
                <div>Customer: <strong className="text-slate-900">{selectedEddCustomer.customerName}</strong> ({selectedEddCustomer.customerNumber})</div>
                <div>Risk Rating: <span className="font-bold text-rose-700">{selectedEddCustomer.riskCategory}</span></div>
                {selectedEddCustomer.isPep && <div className="text-rose-700 font-bold">Category: Politically Exposed Person (PEP)</div>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Documented Source of Wealth & Funds
                </label>
                <input
                  type="text"
                  value={eddSourceOfWealth}
                  onChange={(e) => setEddSourceOfWealth(e.target.value)}
                  placeholder="e.g. Commercial Real Estate Leases & Technology Equity Dividends"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Ultimate Beneficial Ownership (UBO) Verification
                </label>
                <input
                  type="text"
                  value={eddBeneficialOwnership}
                  onChange={(e) => setEddBeneficialOwnership(e.target.value)}
                  placeholder="e.g. 100% Direct Beneficial Ownership verified via Corporate MCA Filing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Senior Compliance Sign-off Remarks
                </label>
                <textarea
                  value={eddRemarks}
                  onChange={(e) => setEddRemarks(e.target.value)}
                  rows={2}
                  placeholder="Detailed rationale for approving or declining institutional relationship..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleEddDecision('REJECT')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-xl text-xs border border-rose-200"
                >
                  Reject & Place Restriction
                </button>
                <button
                  type="button"
                  onClick={() => handleEddDecision('APPROVE')}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Approve EDD Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RISK RECLASSIFICATION MODAL */}
      {reclassifyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-sm font-sans">
                Customer Risk Reclassification
              </h3>
              <button onClick={() => setReclassifyCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <p className="text-slate-600">
                Reclassifying <strong>{reclassifyCustomer.customerName}</strong> will automatically recompute their statutory periodic review due date and trigger Enhanced Due Diligence where applicable.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Select Statutory Risk Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'PEP'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedNewRisk(cat)}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                        selectedNewRisk === cat
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{cat} RISK</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        {cat === 'LOW' ? '10 Yr Review' : cat === 'MEDIUM' ? '8 Yr Review' : '2 Yr Review + EDD'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReclassifyCustomer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReclassifyRisk}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Update Risk Classification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RULE MODAL */}
      {selectedRuleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-sm font-sans">
                Adjust AML Detection Parameters
              </h3>
              <button onClick={() => setSelectedRuleToEdit(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedRuleToEdit.ruleName}</div>
                <div className="text-slate-500 text-[11px]">{selectedRuleToEdit.ruleCode}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Trigger Threshold Amount (₹)
                </label>
                <input
                  type="number"
                  value={ruleThresholdInput}
                  onChange={(e) => setRuleThresholdInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                  Rolling Lookback Window (Hours)
                </label>
                <input
                  type="number"
                  value={ruleLookbackInput}
                  onChange={(e) => setRuleLookbackInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRuleToEdit(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRuleConfig}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Parameters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
