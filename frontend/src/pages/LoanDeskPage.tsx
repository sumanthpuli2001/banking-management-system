import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
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
  TrendingDown,
  ShieldCheck,
  Building,
  DollarSign,
  Printer,
  ChevronRight,
  Filter,
  Check,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  BadgeAlert,
  Percent,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

export interface LoanProduct {
  id: number;
  productCode: string;
  productName: string;
  loanType: string;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  processingFeePercentage: number;
  maxFoirPercentage: number;
  minCreditScore: number;
  collateralRequired: boolean;
  description?: string;
  isActive: boolean;
}

export interface LoanSanctionLetter {
  id: number;
  sanctionReference: string;
  loanApplicationId: number;
  customerId: number;
  customerName: string;
  sanctionedAmount: number;
  approvedInterestRate: number;
  approvedTenureMonths: number;
  monthlyEmi: number;
  processingFeeAmount: number;
  sanctionDate: string;
  validityExpiryDate: string;
  approvingAuthorityLevel: string;
  sanctioningOfficerUsername: string;
  specialConditions: string;
  status: string;
}

export interface LoanApplication {
  id: number;
  applicationNumber: string;
  customerId: number;
  customerName: string;
  customerNumber: string;
  accountNumber?: string;
  branchId?: number;
  branchName: string;
  loanType: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  purpose: string;
  monthlyIncome: number;
  existingMonthlyObligations: number;
  foirPercentage: number;
  creditScore: number;
  creditRiskGrade: string; // PRIME, NEAR_PRIME, SUBPRIME, HIGH_RISK
  bureauStatus: string;
  approvalHierarchyLevel: string;
  sanctionLetterReference?: string;
  status: string; // SUBMITTED, UNDER_REVIEW, APPROVED, DISBURSED, REJECTED
  remarks?: string;
  applicationDate: string;
}

export interface LoanAccount {
  id: number;
  loanAccountNumber: string;
  customerId: number;
  customerName: string;
  branchId?: number;
  branchName: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  outstandingPrincipal: number;
  totalRepaidPrincipal: number;
  totalRepaidInterest: number;
  assetClassification: 'STANDARD' | 'SMA_0' | 'SMA_1' | 'SMA_2' | 'SUBSTANDARD_NPA' | 'DOUBTFUL_NPA' | 'LOSS_ASSET';
  daysPastDue: number;
  provisioningPercentage: number;
  requiredProvisionAmount: number;
  accruedPenalInterest: number;
  status: string;
  sanctionedDate: string;
  maturityDate: string;
  nextDueDate?: string;
}

export interface RepaymentScheduleItem {
  id: number;
  installmentNumber: number;
  dueDate: string;
  installmentAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
  status: string;
  paymentDate?: string;
  paymentReference?: string;
}

export interface LoanStatementEntry {
  transactionDate: string;
  entryType: string;
  referenceNumber: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  principalBalance: number;
}

export interface LoanStatement {
  loanAccountNumber: string;
  customerName: string;
  customerNumber: string;
  loanType: string;
  sanctionedPrincipal: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  outstandingPrincipal: number;
  totalPrincipalRepaid: number;
  totalInterestRepaid: number;
  assetClassification: string;
  daysPastDue: number;
  requiredProvisionAmount: number;
  entries: LoanStatementEntry[];
}

export interface NpaPortfolioSummary {
  totalLoans: number;
  grossAdvances: number;
  standardCount: number;
  standardAmount: number;
  sma0Count: number;
  sma0Amount: number;
  sma1Count: number;
  sma1Amount: number;
  sma2Count: number;
  sma2Amount: number;
  substandardNpaCount: number;
  substandardNpaAmount: number;
  doubtfulNpaCount: number;
  doubtfulNpaAmount: number;
  lossAssetCount: number;
  lossAssetAmount: number;
  grossNpaRatioPercentage: number;
  netNpaRatioPercentage: number;
  totalRequiredProvisions: number;
}

// Fallback baseline data ensuring resilient UI
const FALLBACK_PRODUCTS: LoanProduct[] = [
  {
    id: 1,
    productCode: 'PROD_HOME_PRIME',
    productName: 'Prime Retail Home Loan',
    loanType: 'HOME_LOAN',
    minAmount: 1000000,
    maxAmount: 100000000,
    minTenureMonths: 60,
    maxTenureMonths: 360,
    baseInterestRate: 8.50,
    processingFeePercentage: 0.50,
    maxFoirPercentage: 60.0,
    minCreditScore: 700,
    collateralRequired: true,
    description: 'Long-term residential mortgage facility with competitive reducing-balance interest rates.',
    isActive: true,
  },
  {
    id: 2,
    productCode: 'PROD_AUTO_FLEX',
    productName: 'Flexi Auto Vehicle Advance',
    loanType: 'VEHICLE_LOAN',
    minAmount: 200000,
    maxAmount: 5000000,
    minTenureMonths: 12,
    maxTenureMonths: 84,
    baseInterestRate: 9.25,
    processingFeePercentage: 1.00,
    maxFoirPercentage: 55.0,
    minCreditScore: 680,
    collateralRequired: true,
    description: 'Hypothecated auto financing for commercial and personal passenger vehicles.',
    isActive: true,
  },
  {
    id: 3,
    productCode: 'PROD_PERSONAL_INSTANT',
    productName: 'Instant Clean Personal Facility',
    loanType: 'PERSONAL_LOAN',
    minAmount: 50000,
    maxAmount: 1500000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    baseInterestRate: 11.50,
    processingFeePercentage: 1.50,
    maxFoirPercentage: 50.0,
    minCreditScore: 720,
    collateralRequired: false,
    description: 'Unsecured credit facility for immediate liquidity, wedding, travel, or medical contingencies.',
    isActive: true,
  },
  {
    id: 4,
    productCode: 'PROD_SME_GROWTH',
    productName: 'SME Commercial Working Capital',
    loanType: 'BUSINESS_LOAN',
    minAmount: 500000,
    maxAmount: 50000000,
    minTenureMonths: 12,
    maxTenureMonths: 120,
    baseInterestRate: 10.25,
    processingFeePercentage: 1.25,
    maxFoirPercentage: 65.0,
    minCreditScore: 650,
    collateralRequired: true,
    description: 'Working capital and term debt for registered MSME enterprises with quarterly stock audits.',
    isActive: true,
  },
  {
    id: 5,
    productCode: 'PROD_EDUCATION_MERIT',
    productName: 'Merit Scholar Higher Education',
    loanType: 'EDUCATION_LOAN',
    minAmount: 200000,
    maxAmount: 4000000,
    minTenureMonths: 24,
    maxTenureMonths: 144,
    baseInterestRate: 8.75,
    processingFeePercentage: 0.75,
    maxFoirPercentage: 50.0,
    minCreditScore: 650,
    collateralRequired: false,
    description: 'Special concession loan for premier university admissions in India and accredited overseas.',
    isActive: true,
  },
];

export const LoanDeskPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE_LOANS' | 'ORIGINATION' | 'PRODUCTS' | 'NPA_CONSOLE'>('ACTIVE_LOANS');

  // Core Data States
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loans, setLoans] = useState<LoanAccount[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>(FALLBACK_PRODUCTS);
  const [npaSummary, setNpaSummary] = useState<NpaPortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters and Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [originationFilter, setOriginationFilter] = useState<string>('ALL');
  const [loanPage, setLoanPage] = useState<number>(1);
  const [loanPageSize, setLoanPageSize] = useState<number>(10);
  const [appPage, setAppPage] = useState<number>(1);
  const [appPageSize, setAppPageSize] = useState<number>(10);

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [applyForm, setApplyForm] = useState({
    customerId: 1,
    productCode: 'PROD_HOME_PRIME',
    loanType: 'HOME_LOAN',
    requestedAmount: 3500000,
    requestedTenureMonths: 180,
    purpose: 'Residential Flat Purchase & Stamp Duty',
    monthlyIncome: 145000,
    existingMonthlyObligations: 22000,
    currentEmployer: 'Tata Consultancy Services',
  });
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string>('');
  const [applySuccess, setApplySuccess] = useState<string>('');

  // Schedule Modal State
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<LoanAccount | null>(null);
  const [scheduleItems, setScheduleItems] = useState<RepaymentScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);

  // Sanction Letter Modal State
  const [sanctionLetter, setSanctionLetter] = useState<LoanSanctionLetter | null>(null);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState<boolean>(false);
  const [loadingSanctionLetter, setLoadingSanctionLetter] = useState<boolean>(false);

  // Repayment Modal State
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<LoanAccount | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'ACCOUNT_DEBIT' | 'CASH_COUNTER'>('ACCOUNT_DEBIT');
  const [repayNarration, setRepayNarration] = useState<string>('Monthly installment recovery');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState<boolean>(false);
  const [repayError, setRepayError] = useState<string>('');
  const [repaySuccess, setRepaySuccess] = useState<string>('');

  // Loan Statement Modal State
  const [selectedLoanForStatement, setSelectedLoanForStatement] = useState<LoanAccount | null>(null);
  const [loanStatement, setLoanStatement] = useState<LoanStatement | null>(null);
  const [loadingStatement, setLoadingStatement] = useState<boolean>(false);

  // Action status indicators
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [appRes, loanRes, prodRes, npaRes] = await Promise.allSettled([
        api.get<ApiResponse<{ content: LoanApplication[] }>>('/loans/applications?size=100'),
        api.get<ApiResponse<{ content: LoanAccount[] }>>('/loans?size=100'),
        api.get<ApiResponse<LoanProduct[]>>('/loans/products'),
        api.get<ApiResponse<NpaPortfolioSummary>>('/loans/npa/summary'),
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data?.success && appRes.value.data.data?.content) {
        setApplications(appRes.value.data.data.content);
      }
      if (loanRes.status === 'fulfilled' && loanRes.value.data?.success && loanRes.value.data.data?.content) {
        setLoans(loanRes.value.data.data.content);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data?.success && prodRes.value.data.data) {
        setProducts(prodRes.value.data.data);
      }
      if (npaRes.status === 'fulfilled' && npaRes.value.data?.success && npaRes.value.data.data) {
        setNpaSummary(npaRes.value.data.data);
      }
    } catch {
      // Keep resilient fallback
    } finally {
      setLoading(false);
    }
  };

  const refreshLoans = async () => {
    try {
      const [loanRes, npaRes] = await Promise.allSettled([
        api.get<ApiResponse<{ content: LoanAccount[] }>>('/loans?size=100'),
        api.get<ApiResponse<NpaPortfolioSummary>>('/loans/npa/summary'),
      ]);
      if (loanRes.status === 'fulfilled' && loanRes.value.data?.success && loanRes.value.data.data?.content) {
        setLoans(loanRes.value.data.data.content);
      }
      if (npaRes.status === 'fulfilled' && npaRes.value.data?.success && npaRes.value.data.data) {
        setNpaSummary(npaRes.value.data.data);
      }
    } catch {
      // silent
    }
  };

  const refreshApplications = async () => {
    try {
      const res = await api.get<ApiResponse<{ content: LoanApplication[] }>>('/loans/applications?size=100');
      if (res.data?.success && res.data.data?.content) {
        setApplications(res.data.data.content);
      }
    } catch {
      // silent
    }
  };

  // Live reducing-balance EMI calculation
  const calculateLiveEMI = (principal: number, tenureMonths: number, annualRate: number = 8.5) => {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    if (denominator <= 0) return 0;
    return Math.round(numerator / denominator);
  };

  // Safe date parser
  const formatDate = (dateVal?: unknown) => {
    if (!dateVal) return '—';
    try {
      if (Array.isArray(dateVal)) {
        const [y, m, d, h = 0, min = 0] = dateVal;
        const dt = new Date(y, m - 1, d, h, min);
        return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      const dt = new Date(dateVal as string | number);
      return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  // Handle Submit Application
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApp(true);
    setApplyError('');
    setApplySuccess('');
    try {
      const res = await api.post<ApiResponse<LoanApplication>>('/loans/applications', applyForm);
      if (res.data?.success) {
        setApplySuccess('Credit facility application registered with automated FOIR and CIBIL risk underwriting!');
        refreshApplications();
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setApplySuccess('');
        }, 1500);
      } else {
        setApplyError(res.data?.message || 'Failed to submit credit application');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setApplyError(errorObj.response?.data?.message || 'Error communicating with loan origination service');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Handle Sanction & Disburse
  const handleSanctionAndDisburse = async (appId: number) => {
    if (!window.confirm('Confirm sanction letter issuance, pure BigDecimal amortization generation, and double-entry fund disbursement (DR 1020 / CR 2010)?')) return;
    setActionLoadingId(appId);
    try {
      const res = await api.post(`/loans/applications/${appId}/approve`);
      if (res.data?.success) {
        alert('Loan Sanctioned and Disbursed successfully! GL accounting entries posted and amortization schedule activated.');
        refreshApplications();
        refreshLoans();
      } else {
        alert(res.data?.message || 'Sanction processing failed');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to sanction and disburse loan');
    } finally {
      setActionLoadingId(null);
    }
  };

  // View Sanction Letter
  const handleViewSanctionLetter = async (appId: number) => {
    setLoadingSanctionLetter(true);
    setIsSanctionModalOpen(true);
    setSanctionLetter(null);
    try {
      const res = await api.get<ApiResponse<LoanSanctionLetter>>(`/loans/applications/${appId}/sanction`);
      if (res.data?.success && res.data.data) {
        setSanctionLetter(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSanctionLetter(false);
    }
  };

  // View Schedule
  const handleViewSchedule = async (loan: LoanAccount) => {
    setSelectedLoanForSchedule(loan);
    setLoadingSchedule(true);
    setScheduleItems([]);
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

  // View Statement
  const handleViewStatement = async (loan: LoanAccount) => {
    setSelectedLoanForStatement(loan);
    setLoadingStatement(true);
    setLoanStatement(null);
    try {
      const res = await api.get<ApiResponse<LoanStatement>>(`/loans/${loan.id}/statement`);
      if (res.data?.success && res.data.data) {
        setLoanStatement(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingStatement(false);
    }
  };

  // Open Repayment Modal
  const handleOpenRepaymentModal = (loan: LoanAccount) => {
    setSelectedLoanForRepay(loan);
    setRepayAmount(loan.monthlyEmi || 10000);
    setPaymentMethod('ACCOUNT_DEBIT');
    setRepayNarration(`Installment recovery for facility #${loan.loanAccountNumber}`);
    setRepayError('');
    setRepaySuccess('');
  };

  // Process Repayment
  const handleExecuteRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;
    if (repayAmount <= 0) {
      setRepayError('Repayment amount must be greater than INR 0.00');
      return;
    }
    setIsSubmittingRepay(true);
    setRepayError('');
    setRepaySuccess('');
    try {
      const payload = {
        loanId: selectedLoanForRepay.id,
        amount: repayAmount,
        paymentMethod: paymentMethod,
        narration: repayNarration,
      };
      const res = await api.post('/loans/repayments', payload);
      if (res.data?.success) {
        setRepaySuccess('Repayment processed successfully! Split credited across penalty, interest, and principal reduction.');
        refreshLoans();
        setTimeout(() => {
          setSelectedLoanForRepay(null);
          setRepaySuccess('');
        }, 1500);
      } else {
        setRepayError(res.data?.message || 'Failed to process repayment');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setRepayError(errorObj.response?.data?.message || 'Error posting repayment transaction');
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  // Filtered Loans
  const filteredLoans = loans.filter((l) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (l.customerName || '').toLowerCase().includes(term) ||
      (l.loanAccountNumber || '').toLowerCase().includes(term) ||
      (l.loanType || '').toLowerCase().includes(term) ||
      (l.branchName || '').toLowerCase().includes(term);
    const matchesClassification = assetFilter === 'ALL' || l.assetClassification === assetFilter;
    return matchesSearch && matchesClassification;
  });

  const paginatedLoans = filteredLoans.slice((loanPage - 1) * loanPageSize, loanPage * loanPageSize);

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (app.customerName || '').toLowerCase().includes(term) ||
      (app.applicationNumber || '').toLowerCase().includes(term) ||
      (app.loanType || '').toLowerCase().includes(term) ||
      (app.branchName || '').toLowerCase().includes(term);
    const matchesStatus = originationFilter === 'ALL' || app.status === originationFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedApps = filteredApps.slice((appPage - 1) * appPageSize, appPage * appPageSize);

  // Metrics Calculation
  const totalSanctionedGross = loans.reduce((acc, curr) => acc + (curr.principalAmount || 0), 0);
  const totalOutstandingBalance = loans.reduce((acc, curr) => acc + (curr.outstandingPrincipal || 0), 0);
  const totalStandardLoans = loans.filter((l) => l.assetClassification === 'STANDARD' || !l.assetClassification).length;
  const totalSmaWatchlist = loans.filter((l) => ['SMA_0', 'SMA_1', 'SMA_2'].includes(l.assetClassification)).length;
  const totalNpaLoans = loans.filter((l) => ['SUBSTANDARD_NPA', 'DOUBTFUL_NPA', 'LOSS_ASSET'].includes(l.assetClassification)).length;
  const totalRequiredProvisions = loans.reduce((acc, curr) => acc + (curr.requiredProvisionAmount || 0), 0);

  // Color helper for Asset Classification
  const getAssetBadgeClass = (classification: string) => {
    switch (classification) {
      case 'STANDARD':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'SMA_0':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'SMA_1':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'SMA_2':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SUBSTANDARD_NPA':
        return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'DOUBTFUL_NPA':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'LOSS_ASSET':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRiskGradeBadge = (grade?: string) => {
    switch (grade) {
      case 'PRIME':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'NEAR_PRIME':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'SUBPRIME':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'HIGH_RISK':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner / Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Apex Core Banking Engine</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Asset Origination, Servicing & NPA Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-emerald-600 shrink-0" />
            Credit Operations, Lending Hub & NPA Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated FOIR underwriting, pure BigDecimal reducing-balance amortization schedules, sanction letters, and RBI IRAC provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              fetchInitialData();
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4 text-emerald-600" /> Refresh Book
          </button>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 text-emerald-400" /> Originate Loan
          </button>
        </div>
      </div>

      {/* Credit Portfolio & Asset Health KPIs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Gross Credit Advances</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalOutstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Sanctioned: ₹{(totalSanctionedGross / 10000000).toFixed(2)} Cr</span>
            <span className="font-semibold text-emerald-600">{loans.length} Accounts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Standard Performing Advances</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-sans">
            {totalStandardLoans} Facilities
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>0 DPD • 0.40% Standard Provision</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">SMA Watchlist (SMA-0/1/2)</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1 font-sans">
            {totalSmaWatchlist} Accounts
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Special Mention early alert queue</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Gross NPA & Statutory Provision</p>
          <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1 font-sans">
            {npaSummary?.grossNpaRatioPercentage ? `${npaSummary.grossNpaRatioPercentage.toFixed(2)}%` : totalNpaLoans === 0 ? '0.00%' : `${totalNpaLoans} NPA`}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-medium text-slate-700">Held: ₹{totalRequiredProvisions.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('ACTIVE_LOANS')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ACTIVE_LOANS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Active Advances & Asset Classification ({loans.length})
          </button>

          <button
            onClick={() => setActiveTab('ORIGINATION')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ORIGINATION'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Origination & Underwriting Queue ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'PRODUCTS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            Loan Products Catalogue ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('NPA_CONSOLE')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'NPA_CONSOLE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            NPA Provisioning & IRAC Matrix
          </button>
        </nav>
      </div>

      {/* TAB 1: ACTIVE LOANS & ASSET HEALTH */}
      {activeTab === 'ACTIVE_LOANS' && (
        <div className="space-y-4">
          {/* Filters & Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase font-mono">Bucket:</span>
              {['ALL', 'STANDARD', 'SMA_0', 'SMA_1', 'SMA_2', 'SUBSTANDARD_NPA', 'DOUBTFUL_NPA', 'LOSS_ASSET'].map((bucket) => (
                <button
                  key={bucket}
                  onClick={() => {
                    setAssetFilter(bucket);
                    setLoanPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                    assetFilter === bucket
                      ? 'bg-[#06231D] text-emerald-300 border-[#06231D]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {bucket.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setLoanPage(1);
                }}
                placeholder="Search account #, borrower, branch..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
              />
            </div>
          </div>

          {/* Advances Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Facility / Borrower</th>
                    <th className="px-4 py-3.5">Product Type</th>
                    <th className="px-4 py-3.5">Sanctioned Principal</th>
                    <th className="px-4 py-3.5">Outstanding Balance</th>
                    <th className="px-4 py-3.5">Rate & Monthly EMI</th>
                    <th className="px-4 py-3.5">Asset Health / DPD</th>
                    <th className="px-4 py-3.5">Provision / Penalty</th>
                    <th className="px-4 py-3.5 text-right">Servicing Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading active institutional credit facilities...
                      </td>
                    </tr>
                  ) : paginatedLoans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No active loan facilities found matching selected classification filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{loan.customerName}</div>
                          <div className="font-mono text-[11px] text-emerald-700 font-semibold mt-0.5">
                            {loan.loanAccountNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">{loan.branchName || 'Head Office'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {loan.loanType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                          ₹{(loan.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-700 text-sm">
                          ₹{(loan.outstandingPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-semibold text-slate-900">
                            ₹{(loan.monthlyEmi || 0).toLocaleString('en-IN')} / mo
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            @ {loan.interestRate}% p.a. • {loan.tenureMonths}m
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[10px] border ${getAssetBadgeClass(
                              loan.assetClassification || 'STANDARD'
                            )}`}
                          >
                            {loan.assetClassification || 'STANDARD'}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {loan.daysPastDue || 0} DPD (Overdue)
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <div className="text-slate-700">
                            Prov: ₹{(loan.requiredProvisionAmount || 0).toLocaleString('en-IN')}
                          </div>
                          {loan.accruedPenalInterest && loan.accruedPenalInterest > 0 ? (
                            <div className="text-rose-600 font-semibold text-[10px]">
                              Penal: ₹{loan.accruedPenalInterest.toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[10px]">No penal charges</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRepaymentModal(loan)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              Repay
                            </button>
                            <button
                              onClick={() => handleViewSchedule(loan)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-all"
                              title="Reducing Balance EMI Amortization"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => handleViewStatement(loan)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-all"
                              title="Loan Ledger Account Statement"
                            >
                              Statement
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={loanPage}
              totalItems={filteredLoans.length}
              pageSize={loanPageSize}
              onPageChange={(p) => setLoanPage(p)}
              onPageSizeChange={(s) => {
                setLoanPageSize(s);
                setLoanPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: ORIGINATION & UNDERWRITING QUEUE */}
      {activeTab === 'ORIGINATION' && (
        <div className="space-y-4">
          {/* Status filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 uppercase font-mono">Status:</span>
              {['ALL', 'SUBMITTED', 'APPROVED', 'DISBURSED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setOriginationFilter(st);
                    setAppPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                    originationFilter === st
                      ? 'bg-[#06231D] text-emerald-300 border-[#06231D]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setAppPage(1);
                }}
                placeholder="Search file #, customer, facility..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
              />
            </div>
          </div>

          {/* Underwriting Queue Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Application # / Applicant</th>
                    <th className="px-4 py-3.5">Loan Facility</th>
                    <th className="px-4 py-3.5">Requested Amount</th>
                    <th className="px-4 py-3.5">Monthly Income / Obligations</th>
                    <th className="px-4 py-3.5">FOIR Assessment</th>
                    <th className="px-4 py-3.5">Bureau & Risk Grade</th>
                    <th className="px-4 py-3.5">Approval Hierarchy</th>
                    <th className="px-4 py-3.5 text-right">Sanction Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading loan underwriting pipeline...
                      </td>
                    </tr>
                  ) : paginatedApps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        No loan applications in current underwriting stage.
                      </td>
                    </tr>
                  ) : (
                    paginatedApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{app.customerName}</div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            {app.applicationNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">{app.branchName} • {formatDate(app.applicationDate)}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {app.loanType}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{app.purpose}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          ₹{(app.requestedAmount || 0).toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {app.requestedTenureMonths} Months
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <div className="text-slate-800">
                            Income: ₹{(app.monthlyIncome || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            Obligations: ₹{(app.existingMonthlyObligations || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                              (app.foirPercentage || 0) <= 50
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : (app.foirPercentage || 0) <= 65
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            FOIR: {app.foirPercentage ? `${app.foirPercentage.toFixed(1)}%` : '—'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {(app.foirPercentage || 0) <= 60 ? 'Within Policy Cap' : 'High Obligation'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] border ${getRiskGradeBadge(
                              app.creditRiskGrade
                            )}`}
                          >
                            {app.creditRiskGrade || 'PRIME'}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            CIBIL: {app.creditScore || 750} ({app.bureauStatus || 'VERIFIED'})
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {app.approvalHierarchyLevel || 'BRANCH_MANAGER'}
                          </div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              app.status === 'DISBURSED' || app.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : app.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' ? (
                              <button
                                onClick={() => handleSanctionAndDisburse(app.id)}
                                disabled={actionLoadingId === app.id}
                                className="px-3 py-1 bg-[#06231D] hover:bg-[#047857] disabled:opacity-50 text-white font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                {actionLoadingId === app.id ? 'Sanctioning...' : 'Sanction & Disburse'}
                              </button>
                            ) : null}

                            {(app.status === 'APPROVED' || app.status === 'DISBURSED') && (
                              <button
                                onClick={() => handleViewSanctionLetter(app.id)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 transition-all"
                              >
                                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Sanction Letter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={appPage}
              totalItems={filteredApps.length}
              pageSize={appPageSize}
              onPageChange={(p) => setAppPage(p)}
              onPageSizeChange={(s) => {
                setAppPageSize(s);
                setAppPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: LOAN PRODUCTS CATALOGUE */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                Apex Institutional Loan Products & Lending Guidelines
              </h3>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                Configured retail, commercial, and priority sector advances compliant with RBI Prudential Exposure and Fair Practices Code.
              </p>
            </div>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-4 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="h-4 w-4 text-emerald-400" /> New Loan Application
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {prod.productCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-2">{prod.productName}</h4>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-base">
                      {prod.baseInterestRate}% <span className="text-[10px] text-slate-400 font-sans font-normal">p.a.</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{prod.description}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Amount Range</span>
                      <div className="font-mono font-semibold text-slate-800 text-[11px]">
                        ₹{(prod.minAmount / 100000).toFixed(1)}L - ₹{(prod.maxAmount / 10000000).toFixed(1)}Cr
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Tenure Range</span>
                      <div className="font-mono font-semibold text-slate-800 text-[11px]">
                        {prod.minTenureMonths}m - {prod.maxTenureMonths}m
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Max FOIR Allowed</span>
                      <div className="font-mono font-semibold text-slate-800 text-[11px]">
                        {prod.maxFoirPercentage}% Net Income
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Processing Fee</span>
                      <div className="font-mono font-semibold text-slate-800 text-[11px]">
                        {prod.processingFeePercentage}% + GST
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Min CIBIL: <strong className="font-mono text-slate-700">{prod.minCreditScore}</strong></span>
                    <span>
                      Collateral: {prod.collateralRequired ? (
                        <strong className="text-emerald-700 font-medium">Mandatory</strong>
                      ) : (
                        <span className="text-slate-400">Clean / Unsecured</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setApplyForm((prev) => ({
                        ...prev,
                        productCode: prod.productCode,
                        loanType: prod.loanType,
                        requestedAmount: prod.minAmount * 2 > prod.maxAmount ? prod.minAmount : prod.minAmount * 2,
                        requestedTenureMonths: prod.minTenureMonths * 2 > prod.maxTenureMonths ? prod.minTenureMonths : prod.minTenureMonths * 2,
                      }));
                      setIsApplyModalOpen(true);
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Apply for this Facility</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NPA PROVISIONING & IRAC MATRIX */}
      {activeTab === 'NPA_CONSOLE' && (
        <div className="space-y-5">
          {/* Regulatory IRAC Header */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    RBI/DOR/2023-24/IRAC-01
                  </span>
                  <span className="text-xs text-slate-400 font-mono">• Statutory Prudential Norms</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">
                  Income Recognition, Asset Classification & Provisioning Matrix (IRAC)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automated aging rules classify credit exposures into Standard, SMA (0-90 DPD), Substandard, Doubtful, and Loss buckets with mandatory capital provisioning.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right shrink-0">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Statutory Provision</span>
                <div className="text-xl font-black font-mono text-emerald-800">
                  ₹{totalRequiredProvisions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Charge to Profit & Loss</div>
              </div>
            </div>
          </div>

          {/* IRAC Asset Classification Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Standard Assets */}
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  STANDARD (0 DPD)
                </span>
                <span className="text-[11px] font-bold text-emerald-700">0.40% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {totalStandardLoans}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Performing Credit Facilities</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'STANDARD' || !l.assetClassification).reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* SMA-0 */}
            <div className="bg-white border border-teal-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  SMA-0 (1-30 DPD)
                </span>
                <span className="text-[11px] font-bold text-teal-700">0.40% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'SMA_0').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Early Stress Watchlist</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'SMA_0').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* SMA-1 */}
            <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  SMA-1 (31-60 DPD)
                </span>
                <span className="text-[11px] font-bold text-blue-700">1.00% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'SMA_1').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Secondary Overdue Bucket</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'SMA_1').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* SMA-2 */}
            <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  SMA-2 (61-90 DPD)
                </span>
                <span className="text-[11px] font-bold text-amber-700">2.00% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'SMA_2').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Pre-NPA Escalation Notice</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'SMA_2').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Substandard NPA */}
            <div className="bg-white border border-orange-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  SUBSTANDARD (91-365 DPD)
                </span>
                <span className="text-[11px] font-bold text-orange-700">15.00% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'SUBSTANDARD_NPA').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Non-Performing Asset Tier 1</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'SUBSTANDARD_NPA').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Doubtful NPA */}
            <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  DOUBTFUL (366-730 DPD)
                </span>
                <span className="text-[11px] font-bold text-rose-700">25.00% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'DOUBTFUL_NPA').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">High Loss Threat Tier</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'DOUBTFUL_NPA').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Loss Asset */}
            <div className="bg-white border border-red-300 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                  LOSS ASSET (&gt;730 DPD)
                </span>
                <span className="text-[11px] font-bold text-red-800">100.00% Prov</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {loans.filter(l => l.assetClassification === 'LOSS_ASSET').length}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Uncollectible Write-off Queue</p>
              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                Exposure: ₹{(loans.filter(l => l.assetClassification === 'LOSS_ASSET').reduce((s, c) => s + (c.outstandingPrincipal || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Summary Ratios */}
            <div className="bg-[#06231D] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  PORTFOLIO HEALTH
                </span>
                <div className="text-2xl font-black text-white mt-3 font-mono">
                  {npaSummary?.grossNpaRatioPercentage ? `${npaSummary.grossNpaRatioPercentage.toFixed(2)}%` : '0.00%'}
                </div>
                <p className="text-xs text-emerald-300/80 mt-0.5">Gross Non-Performing Ratio</p>
              </div>
              <div className="pt-2 border-t border-emerald-900/60 text-[11px] text-emerald-200">
                Net NPA: {npaSummary?.netNpaRatioPercentage ? `${npaSummary.netNpaRatioPercentage.toFixed(2)}%` : '0.00%'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: APPLY FOR CREDIT FACILITY */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">New Credit Facility Application</h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLoan} className="p-6 space-y-4">
              {applyError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{applyError}</span>
                </div>
              )}
              {applySuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{applySuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Customer ID</label>
                  <input
                    type="number"
                    value={applyForm.customerId}
                    onChange={(e) => setApplyForm({ ...applyForm, customerId: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Credit Product</label>
                  <select
                    value={applyForm.productCode}
                    onChange={(e) => {
                      const selected = products.find((p) => p.productCode === e.target.value);
                      setApplyForm({
                        ...applyForm,
                        productCode: e.target.value,
                        loanType: selected ? selected.loanType : applyForm.loanType,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {products.map((p) => (
                      <option key={p.productCode} value={p.productCode}>
                        {p.productName} ({p.baseInterestRate}% p.a.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Requested Facility Principal (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={applyForm.requestedAmount}
                    onChange={(e) => setApplyForm({ ...applyForm, requestedAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Requested Tenure (Months)</label>
                  <input
                    type="number"
                    value={applyForm.requestedTenureMonths}
                    onChange={(e) => setApplyForm({ ...applyForm, requestedTenureMonths: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Verified Net Income (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={applyForm.monthlyIncome}
                    onChange={(e) => setApplyForm({ ...applyForm, monthlyIncome: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Existing Monthly Obligations / EMIs (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={applyForm.existingMonthlyObligations}
                    onChange={(e) => setApplyForm({ ...applyForm, existingMonthlyObligations: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employer / Business Name</label>
                <input
                  type="text"
                  value={applyForm.currentEmployer}
                  onChange={(e) => setApplyForm({ ...applyForm, currentEmployer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Purpose of Loan Advance</label>
                <input
                  type="text"
                  value={applyForm.purpose}
                  onChange={(e) => setApplyForm({ ...applyForm, purpose: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* Live Underwriting & Amortization Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Estimated Monthly EMI</div>
                  <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                    ₹{calculateLiveEMI(applyForm.requestedAmount, applyForm.requestedTenureMonths).toLocaleString('en-IN')} / mo
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Pure Reducing Balance</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Projected FOIR Ratio</div>
                  {(() => {
                    const emi = calculateLiveEMI(applyForm.requestedAmount, applyForm.requestedTenureMonths);
                    const totalObligations = applyForm.existingMonthlyObligations + emi;
                    const foir = applyForm.monthlyIncome > 0 ? (totalObligations / applyForm.monthlyIncome) * 100 : 0;
                    return (
                      <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                        {foir.toFixed(1)}%{' '}
                        <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${foir <= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {foir <= 60 ? 'Eligible' : 'Exceeds Cap'}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="text-[10px] text-slate-500 font-mono">Policy Max: 60.0%</div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApp}
                  className="px-5 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isSubmittingApp ? 'Underwriting & Submitting...' : 'Register Loan Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EMI AMORTIZATION SCHEDULE */}
      {selectedLoanForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-700" />
                  Equated Monthly Installment (EMI) Reducing Balance Amortization
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                  Facility #{selectedLoanForSchedule.loanAccountNumber} • {selectedLoanForSchedule.customerName} • Rate: {selectedLoanForSchedule.interestRate}% p.a.
                </div>
              </div>
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Sanctioned Principal:</span>
                  <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">
                    ₹{(selectedLoanForSchedule.principalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Current Outstanding:</span>
                  <div className="font-bold font-mono text-emerald-700 text-sm mt-0.5">
                    ₹{(selectedLoanForSchedule.outstandingPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Monthly Installment (EMI):</span>
                  <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">
                    ₹{(selectedLoanForSchedule.monthlyEmi || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Installment #</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Monthly EMI</th>
                      <th className="px-4 py-2.5">Principal Component</th>
                      <th className="px-4 py-2.5">Interest Component</th>
                      <th className="px-4 py-2.5">Closing Principal</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {loadingSchedule ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                          Loading pure BigDecimal amortization table...
                        </td>
                      </tr>
                    ) : scheduleItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No schedule items generated.
                        </td>
                      </tr>
                    ) : (
                      scheduleItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-bold text-slate-900">Month {item.installmentNumber}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(item.dueDate)}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">
                            ₹{(item.installmentAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-emerald-700 font-semibold">
                            ₹{(item.principalComponent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            ₹{(item.interestComponent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-slate-900 font-semibold">
                            ₹{(item.remainingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                item.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
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

            <div className="bg-slate-50 px-6 py-3 flex justify-end border-t border-slate-200 shrink-0">
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INSTITUTIONAL SANCTION LETTER */}
      {isSanctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Formal Credit Facility Sanction Letter</h3>
              </div>
              <button
                onClick={() => setIsSanctionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto font-sans space-y-6">
              {loadingSanctionLetter ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Generating institutional sanction letter...
                </div>
              ) : sanctionLetter ? (
                <div className="border border-slate-300 p-8 rounded-2xl bg-white shadow-sm space-y-6">
                  {/* Bank Header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">APEX NATIONAL BANK</h2>
                      <p className="text-[11px] text-slate-500 font-mono">Head Office • Credit Operations & Underwriting Division</p>
                      <p className="text-[11px] text-slate-400">License No: RBI/NB-CORE/2024/0991</p>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-slate-900">{sanctionLetter.sanctionReference}</div>
                      <div className="text-slate-500">Date: {formatDate(sanctionLetter.sanctionDate)}</div>
                      <div className="text-rose-600 font-semibold">Valid Thru: {formatDate(sanctionLetter.validityExpiryDate)}</div>
                    </div>
                  </div>

                  {/* Salutation */}
                  <div className="text-xs text-slate-700 space-y-1">
                    <p>To,</p>
                    <p className="font-bold text-slate-900">{sanctionLetter.customerName}</p>
                    <p className="font-mono text-slate-500">Customer ID: {sanctionLetter.customerId}</p>
                    <p className="mt-2 text-slate-800 font-medium">
                      Subject: Letter of Sanction for Credit Facility
                    </p>
                  </div>

                  {/* Terms Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-slate-50/70">
                          <td className="px-4 py-2.5 font-semibold text-slate-600 w-1/3">Sanctioned Principal</td>
                          <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                            ₹{(sanctionLetter.sanctionedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-semibold text-slate-600">Approved Interest Rate</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">
                            {sanctionLetter.approvedInterestRate}% per annum (Floating reducing-balance basis)
                          </td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="px-4 py-2.5 font-semibold text-slate-600">Sanctioned Tenure</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">
                            {sanctionLetter.approvedTenureMonths} Months
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-semibold text-slate-600">Monthly Installment (EMI)</td>
                          <td className="px-4 py-2.5 font-bold font-mono text-emerald-800">
                            ₹{(sanctionLetter.monthlyEmi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="px-4 py-2.5 font-semibold text-slate-600">Processing Fee & Charges</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">
                            ₹{(sanctionLetter.processingFeeAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-semibold text-slate-600">Approving Authority Level</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">
                            {sanctionLetter.approvingAuthorityLevel} ({sanctionLetter.sanctioningOfficerUsername})
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Special Conditions */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Covenants & Special Sanction Conditions:</span>
                    <p className="text-slate-600 whitespace-pre-wrap">{sanctionLetter.specialConditions || 'Standard retail lending hypothecation and ECS mandate conditions apply.'}</p>
                  </div>

                  {/* Signatures */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs text-slate-500">
                    <div>
                      <div className="h-10 w-32 border-b border-dashed border-slate-400 mb-1"></div>
                      <span>Authorized Signatory</span>
                      <p className="font-mono text-[10px] text-slate-400">Apex National Bank</p>
                    </div>
                    <div className="text-right">
                      <div className="h-10 w-32 border-b border-dashed border-slate-400 mb-1 ml-auto"></div>
                      <span>Borrower Acceptance</span>
                      <p className="font-mono text-[10px] text-slate-400">Sign & Stamp</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No sanction letter found for this application.
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">Status: {sanctionLetter?.status || 'SANCTIONED'}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Letter
                </button>
                <button
                  onClick={() => setIsSanctionModalOpen(false)}
                  className="px-4 py-1.5 bg-[#06231D] text-white font-semibold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LOAN REPAYMENT & GL ALLOCATION */}
      {selectedLoanForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Loan Installment Recovery & Repayment</h3>
              </div>
              <button
                onClick={() => setSelectedLoanForRepay(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRepayment} className="p-6 space-y-4">
              {repayError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{repayError}</span>
                </div>
              )}
              {repaySuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{repaySuccess}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Facility Account:</span>
                  <span className="font-bold text-slate-900">{selectedLoanForRepay.loanAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Borrower:</span>
                  <span className="font-bold text-slate-900">{selectedLoanForRepay.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Outstanding Principal:</span>
                  <span className="font-bold text-emerald-800">
                    ₹{(selectedLoanForRepay.outstandingPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Standard EMI Amount:</span>
                  <span className="font-bold text-slate-900">
                    ₹{(selectedLoanForRepay.monthlyEmi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedLoanForRepay.accruedPenalInterest && selectedLoanForRepay.accruedPenalInterest > 0 ? (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span className="font-sans">Accrued Penal Interest:</span>
                    <span>₹{selectedLoanForRepay.accruedPenalInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Repayment Amount (₹)</label>
                <input
                  type="number"
                  step="100"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-base focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'ACCOUNT_DEBIT' | 'CASH_COUNTER')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="ACCOUNT_DEBIT">Savings / Current Account Debit</option>
                    <option value="CASH_COUNTER">Branch Cash Counter Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Narration</label>
                  <input
                    type="text"
                    value={repayNarration}
                    onChange={(e) => setRepayNarration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Real-time Allocation Rule Explanation */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-950 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Double-Entry General Ledger Split Rule:
                </span>
                <p className="text-emerald-900/80">
                  Repayment amount applies strictly: <strong>1) Overdue Penal Interest (CR 4020)</strong> &rarr; <strong>2) Normal Accrued Interest (CR 4010)</strong> &rarr; <strong>3) Principal Reduction (CR 1020)</strong>.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForRepay(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepay}
                  className="px-5 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isSubmittingRepay ? 'Processing GL Posting...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LOAN ACCOUNT STATEMENT */}
      {selectedLoanForStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  Loan Facility Ledger & Running Balance Statement
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                  Account #{selectedLoanForStatement.loanAccountNumber} • {selectedLoanForStatement.customerName}
                </div>
              </div>
              <button
                onClick={() => setSelectedLoanForStatement(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingStatement ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Generating loan ledger statement...
                </div>
              ) : loanStatement ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Sanctioned</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        ₹{(loanStatement.sanctionedPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</span>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        ₹{(loanStatement.outstandingPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Principal Repaid</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        ₹{(loanStatement.totalPrincipalRepaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Asset Class</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {loanStatement.assetClassification || 'STANDARD'} ({loanStatement.daysPastDue || 0} DPD)
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Entry Type</th>
                          <th className="px-4 py-2.5">Reference #</th>
                          <th className="px-4 py-2.5">Narration</th>
                          <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                          <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                          <th className="px-4 py-2.5 text-right">Principal Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {loanStatement.entries && loanStatement.entries.length > 0 ? (
                          loanStatement.entries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 text-slate-500">{formatDate(entry.transactionDate)}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-800">{entry.entryType}</td>
                              <td className="px-4 py-2.5 text-slate-500 text-[11px]">{entry.referenceNumber}</td>
                              <td className="px-4 py-2.5 text-slate-600 font-sans text-xs">{entry.description}</td>
                              <td className="px-4 py-2.5 text-right text-rose-600 font-semibold">
                                {entry.debitAmount && entry.debitAmount > 0
                                  ? `₹${entry.debitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                                {entry.creditAmount && entry.creditAmount > 0
                                  ? `₹${entry.creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                                ₹{(entry.principalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              No statement ledger entries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  Unable to load loan ledger statement.
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 flex justify-end border-t border-slate-200 shrink-0">
              <button
                onClick={() => setSelectedLoanForStatement(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDeskPage;
