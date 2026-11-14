import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  Briefcase,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calculator,
  Calendar,
  X,
  CreditCard,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

interface LoanApplication {
  id: number;
  applicationNumber: string;
  customerId: number;
  customerName: string;
  accountNumber: string;
  branchName: string;
  loanType: string;
  requestedAmount: number;
  tenureMonths: number;
  purpose: string;
  annualIncome: number;
  creditScore: number;
  status: string;
  applicationDate: string;
}

interface LoanAccount {
  id: number;
  loanAccountNumber: string;
  customerName: string;
  branchName: string;
  loanType: string;
  sanctionedAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  status: string;
  sanctionedDate: string;
}

interface RepaymentScheduleItem {
  id: number;
  installmentNumber: number;
  dueDate: string;
  installmentAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  status: string;
  paymentDate?: string;
}

export const LoanDeskPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'ACTIVE_LOANS'>('APPLICATIONS');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<LoanAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [applyForm, setApplyForm] = useState({
    customerId: 1,
    accountNumber: '1001000000000001',
    loanType: 'PERSONAL_LOAN',
    requestedAmount: 500000,
    tenureMonths: 36,
    purpose: 'Home Renovation & Solar System',
    annualIncome: 1200000,
    currentEmployer: 'Infosys Limited',
  });
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string>('');

  // Schedule Modal
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<LoanAccount | null>(null);
  const [scheduleItems, setScheduleItems] = useState<RepaymentScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);

  // Action State
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, loanRes] = await Promise.all([
        api.get<ApiResponse<{ content: LoanApplication[] }>>('/loans/applications?size=50'),
        api.get<ApiResponse<{ content: LoanAccount[] }>>('/loans?size=50'),
      ]);
      if (appRes.data?.success && appRes.data.data?.content) {
        setApplications(appRes.data.data.content);
      }
      if (loanRes.data?.success && loanRes.data.data?.content) {
        setLoans(loanRes.data.data.content);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApp(true);
    setApplyError('');
    try {
      const res = await api.post('/loans/applications', applyForm);
      if (res.data?.success) {
        setIsApplyModalOpen(false);
        fetchData();
      } else {
        setApplyError(res.data?.message || 'Failed to submit application');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setApplyError(errorObj.response?.data?.message || 'Error submitting loan application');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleSanctionAndDisburse = async (appId: number) => {
    if (!window.confirm('Confirm sanction and instantaneous disbursement of funds to borrower account?')) return;
    setActionLoadingId(appId);
    try {
      const res = await api.post(`/loans/applications/${appId}/approve`);
      if (res.data?.success) {
        alert('Loan Sanctioned and Disbursed successfully! Amortization schedule active.');
        fetchData();
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to sanction loan');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewSchedule = async (loan: LoanAccount) => {
    setSelectedLoanForSchedule(loan);
    setLoadingSchedule(true);
    try {
      const res = await api.get<ApiResponse<RepaymentScheduleItem[]>>(`/loans/${loan.id}/schedule`);
      if (res.data?.success && res.data.data) {
        setScheduleItems(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Live EMI Calculator formula
  const calculateEMI = (principal: number, tenureMonths: number, annualRate: number = 9.5) => {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  };

  const filteredApps = applications.filter((app) =>
    app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.loanType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoans = loans.filter((l) =>
    l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.loanAccountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.loanType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Portfolio Totals
  const totalDisbursed = loans.reduce((acc, curr) => acc + (curr.sanctionedAmount || 0), 0);
  const totalOutstanding = loans.reduce((acc, curr) => acc + (curr.outstandingPrincipal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Credit Underwriting & Advances</span>
            <span>•</span>
            <span>Asset Portfolio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-blue-400" />
            Credit Desk & Loan Lifecycle Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Origination, credit underwriting, reducing balance EMI amortization schedules, and loan disbursements.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Apply for Loan
        </button>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Sanctioned Advances</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Institutional credit book</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Outstanding Principal</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active loan receivables</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Active Loan Accounts</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{loans.length} Accounts</div>
          <div className="text-[11px] text-slate-500 mt-1">100% Performing Assets (0 NPA)</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Applications in Pipeline</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{applications.length} Files</div>
          <div className="text-[11px] text-slate-500 mt-1">Under review / sanction queue</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'APPLICATIONS'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            Loan Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE_LOANS')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'ACTIVE_LOANS'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Active Advances & Repayments ({loans.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, file #, or type..."
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Applications Table */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">File # / Customer</th>
                  <th className="px-5 py-3.5">Loan Type</th>
                  <th className="px-5 py-3.5">Requested Amount</th>
                  <th className="px-5 py-3.5">Tenure / Purpose</th>
                  <th className="px-5 py-3.5">Credit Score</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Sanction Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading loan application pipeline...
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No loan applications found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{app.customerName}</div>
                        <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                          {app.applicationNumber} • {app.branchName}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-blue-400">{app.loanType}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                        ₹{app.requestedAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-300 font-medium">{app.tenureMonths} Months</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{app.purpose}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            app.creditScore >= 750
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          CIBIL: {app.creditScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            app.status === 'DISBURSED' || app.status === 'APPROVED'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' ? (
                          <button
                            onClick={() => handleSanctionAndDisburse(app.id)}
                            disabled={actionLoadingId === app.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded text-xs inline-flex items-center gap-1 shadow-sm transition-all"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {actionLoadingId === app.id ? 'Sanctioning...' : 'Sanction & Disburse'}
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Active Loans Table */}
      {activeTab === 'ACTIVE_LOANS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Loan Account / Customer</th>
                  <th className="px-5 py-3.5">Loan Facility</th>
                  <th className="px-5 py-3.5">Sanctioned Amount</th>
                  <th className="px-5 py-3.5">Outstanding Balance</th>
                  <th className="px-5 py-3.5">Rate & Monthly EMI</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Repayment Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading active loan accounts...
                    </td>
                  </tr>
                ) : filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No active loan accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{loan.customerName}</div>
                        <div className="font-mono text-blue-400 text-[11px] mt-0.5">
                          {loan.loanAccountNumber}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200">{loan.loanType}</td>
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        ₹{loan.sanctionedAmount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-amber-400 text-sm">
                        ₹{loan.outstandingPrincipal?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white font-mono font-semibold">
                          ₹{loan.emiAmount?.toLocaleString('en-IN')} / mo
                        </div>
                        <div className="text-[11px] text-slate-400">@ {loan.interestRate}% p.a. ({loan.tenureMonths}m)</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleViewSchedule(loan)}
                          className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-500 text-blue-300 hover:text-white rounded text-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Amortization Schedule
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Loan Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">New Credit Facility Application</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="p-6 space-y-4">
              {applyError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-4 py-2.5 rounded-lg text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Customer ID</label>
                  <input
                    type="number"
                    value={applyForm.customerId}
                    onChange={(e) => setApplyForm({ ...applyForm, customerId: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Disbursement Account #</label>
                  <input
                    type="text"
                    value={applyForm.accountNumber}
                    onChange={(e) => setApplyForm({ ...applyForm, accountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Loan Facility Type</label>
                  <select
                    value={applyForm.loanType}
                    onChange={(e) => setApplyForm({ ...applyForm, loanType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  >
                    <option value="PERSONAL_LOAN">Personal Loan (11.5% p.a.)</option>
                    <option value="HOME_LOAN">Home Loan (8.5% p.a.)</option>
                    <option value="VEHICLE_LOAN">Vehicle Loan (9.2% p.a.)</option>
                    <option value="EDUCATION_LOAN">Education Loan (8.75% p.a.)</option>
                    <option value="BUSINESS_LOAN">Commercial Business Loan (10.5% p.a.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Requested Amount (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={applyForm.requestedAmount}
                    onChange={(e) => setApplyForm({ ...applyForm, requestedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={applyForm.tenureMonths}
                    onChange={(e) => setApplyForm({ ...applyForm, tenureMonths: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Annual Declared Income (₹)</label>
                  <input
                    type="number"
                    value={applyForm.annualIncome}
                    onChange={(e) => setApplyForm({ ...applyForm, annualIncome: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Employer / Organization</label>
                <input
                  type="text"
                  value={applyForm.currentEmployer}
                  onChange={(e) => setApplyForm({ ...applyForm, currentEmployer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs"
                />
              </div>

              {/* Live EMI Preview Widget */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Estimated Reducing Balance EMI:</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    ₹{calculateEMI(applyForm.requestedAmount, applyForm.tenureMonths).toLocaleString('en-IN')} / month
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  Total Repayable: ₹{(calculateEMI(applyForm.requestedAmount, applyForm.tenureMonths) * applyForm.tenureMonths).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md"
                >
                  {isSubmittingApp ? 'Submitting...' : 'Register Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amortization Schedule Drawer / Modal */}
      {selectedLoanForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  EMI Repayment Amortization Schedule
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Facility #{selectedLoanForSchedule.loanAccountNumber} • {selectedLoanForSchedule.customerName} • Rate: {selectedLoanForSchedule.interestRate}% p.a.
                </div>
              </div>
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Sanctioned Principal:</span>
                  <div className="font-bold font-mono text-white">
                    ₹{selectedLoanForSchedule.sanctionedAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Current Outstanding:</span>
                  <div className="font-bold font-mono text-amber-400">
                    ₹{selectedLoanForSchedule.outstandingPrincipal.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Monthly Installment (EMI):</span>
                  <div className="font-bold font-mono text-emerald-400">
                    ₹{selectedLoanForSchedule.emiAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Installment #</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">EMI Amount</th>
                      <th className="px-4 py-2.5">Principal Component</th>
                      <th className="px-4 py-2.5">Interest Component</th>
                      <th className="px-4 py-2.5">Closing Balance</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-xs">
                    {loadingSchedule ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                          Loading amortization table...
                        </td>
                      </tr>
                    ) : scheduleItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                          Schedule generating...
                        </td>
                      </tr>
                    ) : (
                      scheduleItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-bold text-white">Month {item.installmentNumber}</td>
                          <td className="px-4 py-3 text-slate-400">{item.dueDate}</td>
                          <td className="px-4 py-3 font-semibold text-white">
                            ₹{item.installmentAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-blue-400">
                            ₹{item.principalComponent.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-amber-400">
                            ₹{item.interestComponent.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            ₹{item.remainingBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'PAID'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-800 px-6 py-3 flex justify-end border-t border-slate-700 shrink-0">
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded text-xs"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoanDeskPage;
