import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  PiggyBank,
  Plus,
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  X,
  Award,
  RefreshCw,
  ShieldCheck,
  Building,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Check,
  Percent
} from 'lucide-react';

export interface DepositProduct {
  id: number;
  productCode: string;
  productName: string;
  depositType: string;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  seniorCitizenBonusRate: number;
  compoundingFrequency: string;
  prematurePenaltyRate: number;
  lockInMonths: number;
  isTaxSaver: boolean;
  description?: string;
  isActive: boolean;
}

export interface TermDepositItem {
  id: number;
  certificateNumber: string;
  customerId: number;
  customerName: string;
  sourceAccountNumber: string;
  branchId?: number;
  branchName: string;
  depositType: string; // FIXED_DEPOSIT, RECURRING_DEPOSIT
  productCode?: string;
  depositAmount: number;
  interestRate: number;
  tenureMonths: number;
  compoundingFrequency: string;
  isSeniorCitizen: boolean;
  seniorCitizenBonusRate: number;
  maturityAmount: number;
  totalInterestPayable: number;
  accruedInterest: number;
  taxDeductedAtSource: number;
  tdsExemptionForm15G: boolean;
  depositDate: string;
  maturityDate: string;
  autoRenew: boolean;
  nomineeName?: string;
  nomineeRelation?: string;
  payoutAccountNumber?: string;
  status: string; // ACTIVE, MATURED, PREMATURELY_CLOSED, AUTO_RENEWED
  closedAt?: string;
  payoutAmount?: number;
  penaltyDeducted?: number;
}

export interface DepositCertificate {
  certificateNumber: string;
  depositType: string;
  productCode: string;
  productName: string;
  customerId: number;
  customerName: string;
  customerNumber: string;
  sourceAccountNumber: string;
  payoutAccountNumber: string;
  branchCode: string;
  branchName: string;
  depositPrincipal: number;
  interestRate: number;
  tenureMonths: number;
  compoundingFrequency: string;
  projectedMaturityAmount: number;
  totalInterestEarned: number;
  depositDate: string;
  maturityDate: string;
  autoRenew: boolean;
  nomineeName: string;
  nomineeRelation: string;
  isSeniorCitizen: boolean;
  tdsExemptionForm15G: boolean;
  status: string;
  authorizedSignatory: string;
}

export interface PrematureClosureQuote {
  depositId: number;
  certificateNumber: string;
  customerName: string;
  originalPrincipal: number;
  originalInterestRate: number;
  contractedTenureMonths: number;
  completedMonths: number;
  prematurePenaltyPercentage: number;
  revisedPenalizedInterestRate: number;
  earnedInterestAmount: number;
  penaltyAmountDeducted: number;
  tdsDeducted: number;
  netPayoutAmount: number;
  payoutDestinationAccount: string;
  quoteTimestamp: string;
  isLockInViolated: boolean;
  lockInWarningMessage?: string;
}

// Resilient fallback products
const FALLBACK_DEPOSIT_PRODUCTS: DepositProduct[] = [
  {
    id: 1,
    productCode: 'FD_STANDARD_PRIME',
    productName: 'Apex Standard Cumulative Fixed Deposit',
    depositType: 'FIXED_DEPOSIT',
    minAmount: 5000,
    maxAmount: 100000000,
    minTenureMonths: 6,
    maxTenureMonths: 120,
    baseInterestRate: 7.10,
    seniorCitizenBonusRate: 0.50,
    compoundingFrequency: 'QUARTERLY',
    prematurePenaltyRate: 1.00,
    lockInMonths: 0,
    isTaxSaver: false,
    description: 'Quarterly compounded institutional term deposit with high liquidity and auto-renewal facility.',
    isActive: true,
  },
  {
    id: 2,
    productCode: 'FD_SENIOR_SECURE',
    productName: 'Apex Golden Years Senior Citizen Deposit',
    depositType: 'FIXED_DEPOSIT',
    minAmount: 10000,
    maxAmount: 50000000,
    minTenureMonths: 12,
    maxTenureMonths: 120,
    baseInterestRate: 7.60,
    seniorCitizenBonusRate: 0.50,
    compoundingFrequency: 'QUARTERLY',
    prematurePenaltyRate: 0.50,
    lockInMonths: 0,
    isTaxSaver: false,
    description: 'Special interest premium for senior citizens with higher TDS exemption limits.',
    isActive: true,
  },
  {
    id: 3,
    productCode: 'FD_TAX_SAVER_5YR',
    productName: 'Apex Section 80C Tax Shield Deposit',
    depositType: 'FIXED_DEPOSIT',
    minAmount: 10000,
    maxAmount: 150000,
    minTenureMonths: 60,
    maxTenureMonths: 60,
    baseInterestRate: 7.25,
    seniorCitizenBonusRate: 0.50,
    compoundingFrequency: 'QUARTERLY',
    prematurePenaltyRate: 2.50,
    lockInMonths: 60,
    isTaxSaver: true,
    description: 'Tax-saving fixed deposit under Section 80C with statutory 5-year lock-in period.',
    isActive: true,
  },
  {
    id: 4,
    productCode: 'RD_WEALTH_BUILDER',
    productName: 'Apex Recurring Wealth Builder',
    depositType: 'RECURRING_DEPOSIT',
    minAmount: 1000,
    maxAmount: 1000000,
    minTenureMonths: 6,
    maxTenureMonths: 60,
    baseInterestRate: 6.85,
    seniorCitizenBonusRate: 0.50,
    compoundingFrequency: 'QUARTERLY',
    prematurePenaltyRate: 1.00,
    lockInMonths: 0,
    isTaxSaver: false,
    description: 'Disciplined monthly savings plan compounding quarterly into a substantial maturity corpus.',
    isActive: true,
  },
];

export const TermDepositPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE_PORTFOLIO' | 'PRODUCTS_SLABS' | 'COMPOUND_SIMULATOR' | 'LIQUIDATION_HISTORY'>('ACTIVE_PORTFOLIO');

  // Core Data States
  const [deposits, setDeposits] = useState<TermDepositItem[]>([]);
  const [products, setProducts] = useState<DepositProduct[]>(FALLBACK_DEPOSIT_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Interactive Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(200000);
  const [calcTenure, setCalcTenure] = useState<number>(24);
  const [calcType, setCalcType] = useState<string>('FIXED_DEPOSIT');
  const [calcRate, setCalcRate] = useState<number>(7.10);
  const [isSeniorCitizenCalc, setIsSeniorCitizenCalc] = useState<boolean>(false);
  const [form15GCalc, setForm15GCalc] = useState<boolean>(false);

  // Open Deposit Modal State
  const [isOpenModalActive, setIsOpenModalActive] = useState<boolean>(false);
  const [fdForm, setFdForm] = useState({
    customerId: 1,
    sourceAccountNumber: '1001000000000001',
    payoutAccountNumber: '1001000000000001',
    depositType: 'FIXED_DEPOSIT',
    productCode: 'FD_STANDARD_PRIME',
    depositAmount: 100000,
    tenureMonths: 12,
    autoRenew: true,
    isSeniorCitizen: false,
    tdsExemptionForm15G: false,
    nomineeName: 'Anita Sharma',
    nomineeRelation: 'SPOUSE',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Certificate Modal State
  const [selectedCertificate, setSelectedCertificate] = useState<DepositCertificate | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState<boolean>(false);

  // Premature Liquidation Modal State
  const [selectedLiquidationQuote, setSelectedLiquidationQuote] = useState<PrematureClosureQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [acknowledgePenalty, setAcknowledgePenalty] = useState<boolean>(false);
  const [liquidationReason, setLiquidationReason] = useState<string>('Personal emergency requirement');
  const [isExecutingLiquidation, setIsExecutingLiquidation] = useState<boolean>(false);
  const [liquidationError, setLiquidationError] = useState<string>('');
  const [liquidationSuccess, setLiquidationSuccess] = useState<string>('');

  // Action loading indicator
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [depRes, prodRes] = await Promise.allSettled([
        api.get<ApiResponse<{ content: TermDepositItem[] }>>('/deposits/term?size=100'),
        api.get<ApiResponse<DepositProduct[]>>('/deposits/products'),
      ]);

      if (depRes.status === 'fulfilled' && depRes.value.data?.success && depRes.value.data.data?.content) {
        setDeposits(depRes.value.data.data.content);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.data?.success && prodRes.value.data.data) {
        setProducts(prodRes.value.data.data);
      }
    } catch {
      // keep resilient fallback
    } finally {
      setLoading(false);
    }
  };

  const refreshDeposits = async () => {
    try {
      const res = await api.get<ApiResponse<{ content: TermDepositItem[] }>>('/deposits/term?size=100');
      if (res.data?.success && res.data.data?.content) {
        setDeposits(res.data.data.content);
      }
    } catch {
      // silent
    }
  };

  // Safe Date Formatter
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

  // Live Pure Formula Compound Calculator
  const calculateLiveCompounding = (
    p: number,
    tMonths: number,
    r: number,
    isSenior: boolean,
    isRd: boolean,
    form15G: boolean
  ) => {
    if (p <= 0 || tMonths <= 0) return { maturity: 0, interest: 0, tds: 0, netMaturity: 0, effectiveRate: r };
    const effectiveRate = isSenior ? r + 0.50 : r;

    let maturity = 0;
    let interest = 0;

    if (isRd) {
      // Monthly installment compounding
      let acc = 0;
      for (let i = 1; i <= tMonths; i++) {
        const remMonths = tMonths - i + 1;
        const quarters = Math.floor(remMonths / 3);
        const remFraction = remMonths % 3;
        const qFactor = Math.pow(1 + effectiveRate / 400, quarters);
        const mFactor = remFraction > 0 ? 1 + (effectiveRate * remFraction) / 1200 : 1;
        acc += p * qFactor * mFactor;
      }
      maturity = Math.round(acc);
      interest = maturity - p * tMonths;
    } else {
      // Lump Sum Fixed Deposit
      const quarters = Math.floor(tMonths / 3);
      const remFraction = tMonths % 3;
      const qFactor = Math.pow(1 + effectiveRate / 400, quarters);
      const mFactor = remFraction > 0 ? 1 + (effectiveRate * remFraction) / 1200 : 1;
      maturity = Math.round(p * qFactor * mFactor);
      interest = maturity - p;
    }

    const threshold = isSenior ? 50000 : 40000;
    let tds = 0;
    if (!form15G && interest > threshold) {
      tds = Math.round(interest * 0.10);
    }
    const netMaturity = maturity - tds;

    return { maturity, interest, tds, netMaturity, effectiveRate };
  };

  // Open Deposit Handler
  const handleCreateFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await api.post<ApiResponse<TermDepositItem>>('/deposits/term', fdForm);
      if (res.data?.success) {
        setSubmitSuccess('Term Deposit registered, certificate generated, and GL accounting posted successfully!');
        refreshDeposits();
        setTimeout(() => {
          setIsOpenModalActive(false);
          setSubmitSuccess('');
        }, 1500);
      } else {
        setSubmitError(res.data?.message || 'Failed to open term deposit');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSubmitError(errorObj.response?.data?.message || 'Error processing deposit booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Certificate
  const handleViewCertificate = async (depositId: number) => {
    setLoadingCertificate(true);
    setSelectedCertificate(null);
    try {
      const res = await api.get<ApiResponse<DepositCertificate>>(`/deposits/term/${depositId}/certificate`);
      if (res.data?.success && res.data.data) {
        setSelectedCertificate(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingCertificate(false);
    }
  };

  // Open Premature Liquidation Quote
  const handleOpenPrematureLiquidation = async (depositId: number) => {
    setLoadingQuote(true);
    setSelectedLiquidationQuote(null);
    setAcknowledgePenalty(false);
    setLiquidationError('');
    setLiquidationSuccess('');
    try {
      const res = await api.get<ApiResponse<PrematureClosureQuote>>(`/deposits/term/${depositId}/premature-quote`);
      if (res.data?.success && res.data.data) {
        setSelectedLiquidationQuote(res.data.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to retrieve premature liquidation quote');
    } finally {
      setLoadingQuote(false);
    }
  };

  // Execute Premature Liquidation
  const handleExecutePrematureLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiquidationQuote) return;
    if (!acknowledgePenalty) {
      setLiquidationError('You must acknowledge the penalty deduction before proceeding with liquidation.');
      return;
    }
    setIsExecutingLiquidation(true);
    setLiquidationError('');
    setLiquidationSuccess('');

    try {
      const payload = {
        depositId: selectedLiquidationQuote.depositId,
        reason: liquidationReason,
        acknowledgePenalty: true,
      };
      const res = await api.post('/deposits/term/premature-close', payload);
      if (res.data?.success) {
        setLiquidationSuccess('Deposit prematurely liquidated! Net payout credited to customer account.');
        refreshDeposits();
        setTimeout(() => {
          setSelectedLiquidationQuote(null);
          setLiquidationSuccess('');
        }, 1500);
      } else {
        setLiquidationError(res.data?.message || 'Premature closure failed');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setLiquidationError(errorObj.response?.data?.message || 'Failed to execute premature closure');
    } finally {
      setIsExecutingLiquidation(false);
    }
  };

  // Auto-Renew
  const handleAutoRenew = async (depositId: number) => {
    if (!window.confirm('Confirm automatic renewal of this deposit for another full tenure period at prevailing rates?')) return;
    setActionLoadingId(depositId);
    try {
      const res = await api.post(`/deposits/term/${depositId}/auto-renew`);
      if (res.data?.success) {
        alert('Term deposit rolled over into new certificate successfully!');
        refreshDeposits();
      } else {
        alert(res.data?.message || 'Auto-renewal failed');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Failed to auto-renew deposit');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered deposits
  const filteredDeposits = deposits.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (d.customerName || '').toLowerCase().includes(term) ||
      (d.certificateNumber || '').toLowerCase().includes(term) ||
      (d.sourceAccountNumber || '').toLowerCase().includes(term) ||
      (d.branchName || '').toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && d.status === 'ACTIVE') ||
      (statusFilter === 'CLOSED' && (d.status === 'PREMATURELY_CLOSED' || d.status === 'MATURED' || d.status === 'AUTO_RENEWED'));

    const matchesType = typeFilter === 'ALL' || d.depositType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedDeposits = filteredDeposits.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Portfolio Totals
  const totalActiveDeposits = deposits.filter((d) => d.status === 'ACTIVE').length;
  const totalActivePrincipal = deposits
    .filter((d) => d.status === 'ACTIVE')
    .reduce((s, d) => s + (d.depositAmount || 0), 0);
  const totalMaturityCorpus = deposits
    .filter((d) => d.status === 'ACTIVE')
    .reduce((s, d) => s + (d.maturityAmount || 0), 0);
  const totalInterestLiabilities = totalMaturityCorpus - totalActivePrincipal;

  const sim = calculateLiveCompounding(
    calcPrincipal,
    calcTenure,
    calcRate,
    isSeniorCitizenCalc,
    calcType === 'RECURRING_DEPOSIT',
    form15GCalc
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner / Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Apex Treasury & Liabilities</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Term Deposits (FD / RD) Lifecycle Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <PiggyBank className="h-7 w-7 text-emerald-600 shrink-0" />
            Term Deposits, Recurring Savings & Treasury Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pure BigDecimal quarterly compounding, senior citizen rate bonuses, Section 194A TDS withholding, and premature liquidation settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchInitialData}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition-all"
          >
            <RefreshCw className="h-4 w-4 text-emerald-600" /> Refresh Book
          </button>
          <button
            onClick={() => setIsOpenModalActive(true)}
            className="px-4 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 text-emerald-400" /> Book Term Deposit
          </button>
        </div>
      </div>

      {/* Institutional Deposit Portfolio KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Time Liabilities (FD/RD)</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalActivePrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Principal Under Custody</span>
            <span className="font-semibold text-emerald-700">{totalActiveDeposits} Certificates</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Projected Maturity Outflows</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-sans">
            ₹{totalMaturityCorpus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>GL Code 2030 / 2040</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Accrued Interest Payable</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalInterestLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>Quarterly Compound Accruals</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Taxation Compliance (TDS)</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 font-sans">
            Section 194A
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>10% on interest &gt; ₹40k / ₹50k</span>
          </div>
        </div>
      </div>

      {/* Main Tabbed Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => {
              setActiveTab('ACTIVE_PORTFOLIO');
              setStatusFilter('ACTIVE');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ACTIVE_PORTFOLIO'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Active Deposit Portfolio ({deposits.filter((d) => d.status === 'ACTIVE').length})
          </button>

          <button
            onClick={() => setActiveTab('PRODUCTS_SLABS')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'PRODUCTS_SLABS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            Deposit Products & Card Rates ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('COMPOUND_SIMULATOR')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'COMPOUND_SIMULATOR'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Quarterly Compound & TDS Simulator
          </button>

          <button
            onClick={() => {
              setActiveTab('LIQUIDATION_HISTORY');
              setStatusFilter('CLOSED');
            }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'LIQUIDATION_HISTORY'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCw className="h-4 w-4" />
            Maturity & Liquidation Ledger
          </button>
        </nav>
      </div>

      {/* TAB 1: ACTIVE DEPOSITS PORTFOLIO */}
      {activeTab === 'ACTIVE_PORTFOLIO' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Type:</span>
              {['ALL', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT'].map((tp) => (
                <button
                  key={tp}
                  onClick={() => {
                    setTypeFilter(tp);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all ${
                    typeFilter === tp
                      ? 'bg-[#06231D] text-emerald-300 border-[#06231D]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tp === 'ALL' ? 'All Deposits' : tp === 'FIXED_DEPOSIT' ? 'Fixed Deposit (FD)' : 'Recurring Deposit (RD)'}
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
                  setCurrentPage(1);
                }}
                placeholder="Search certificate #, customer, account..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Certificate / Customer</th>
                    <th className="px-4 py-3.5">Deposit Type</th>
                    <th className="px-4 py-3.5">Principal Invested</th>
                    <th className="px-4 py-3.5">Contracted Rate</th>
                    <th className="px-4 py-3.5">Maturity Date & Corpus</th>
                    <th className="px-4 py-3.5">Tax (TDS) & Nominee</th>
                    <th className="px-4 py-3.5 text-right">Certificate & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading institutional term deposits...
                      </td>
                    </tr>
                  ) : paginatedDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No active term deposits found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{dep.customerName}</div>
                          <div className="font-mono text-[11px] text-emerald-700 font-semibold mt-0.5">
                            {dep.certificateNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Debited: {dep.sourceAccountNumber} • {dep.branchName}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              dep.depositType === 'RECURRING_DEPOSIT'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {dep.depositType === 'RECURRING_DEPOSIT' ? 'RECURRING (RD)' : 'FIXED (FD)'}
                          </span>
                          {dep.isSeniorCitizen && (
                            <span className="block text-[9px] text-emerald-700 font-semibold mt-0.5">
                              ★ Senior Citizen (+0.50%)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          ₹{(dep.depositAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <div className="text-[10px] text-slate-400 font-sans font-normal">
                            {dep.tenureMonths} Months tenure
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <div className="font-bold text-emerald-800 text-sm">
                            {dep.interestRate}% <span className="text-[10px] font-sans text-slate-400">p.a.</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">Quarterly Compounding</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold font-mono text-slate-900">
                            ₹{(dep.maturityAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Matures: {formatDate(dep.maturityDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[11px]">
                          <div>
                            {dep.tdsExemptionForm15G ? (
                              <span className="text-emerald-700 font-semibold text-[10px]">Form 15G/H Active (0 TDS)</span>
                            ) : dep.taxDeductedAtSource && dep.taxDeductedAtSource > 0 ? (
                              <span className="text-rose-600 font-mono font-semibold text-[10px]">
                                TDS: ₹{dep.taxDeductedAtSource.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Below TDS Threshold</span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            Nominee: {dep.nomineeName || 'None'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewCertificate(dep.id)}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-all"
                            >
                              Certificate
                            </button>
                            <button
                              onClick={() => handleOpenPrematureLiquidation(dep.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              Liquidate
                            </button>
                            <button
                              onClick={() => handleAutoRenew(dep.id)}
                              disabled={actionLoadingId === dep.id}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold transition-all"
                              title="Rollover into new certificate"
                            >
                              Renew
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
              currentPage={currentPage}
              totalItems={filteredDeposits.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & CARD RATES */}
      {activeTab === 'PRODUCTS_SLABS' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                Apex Treasury Deposit Products & Interest Rate Schedule
              </h3>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                Effective card rates with senior citizen concessions (+0.50% p.a.) and Section 80C tax deduction qualifications.
              </p>
            </div>
            <button
              onClick={() => setIsOpenModalActive(true)}
              className="px-4 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="h-4 w-4 text-emerald-400" /> Book New Deposit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {p.productCode}
                    </span>
                    <span className="font-mono font-bold text-emerald-800 text-base">
                      {p.baseInterestRate}% <span className="text-[10px] text-slate-400 font-sans font-normal">p.a.</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{p.productName}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>

                  <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deposit Type:</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{p.depositType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tenure Window:</span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">
                        {p.minTenureMonths}m - {p.maxTenureMonths}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Senior Citizen Rate:</span>
                      <span className="font-bold text-emerald-700 font-mono text-[11px]">
                        {(p.baseInterestRate + p.seniorCitizenBonusRate).toFixed(2)}% p.a.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Premature Penalty:</span>
                      <span className="font-semibold text-rose-700 font-mono text-[11px]">
                        {p.prematurePenaltyRate}% reduction
                      </span>
                    </div>
                    {p.isTaxSaver && (
                      <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                        <span>Tax Deduction:</span>
                        <span>Sec 80C (5yr Lock-in)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setFdForm((prev) => ({
                        ...prev,
                        productCode: p.productCode,
                        depositType: p.depositType,
                        tenureMonths: p.minTenureMonths,
                        depositAmount: p.minAmount,
                      }));
                      setIsOpenModalActive(true);
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Book this Product</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COMPOUND SIMULATOR & TDS CALCULATOR */}
      {activeTab === 'COMPOUND_SIMULATOR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-700" />
                RBI Quarterly Compounding Simulator
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcType('FIXED_DEPOSIT')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      calcType === 'FIXED_DEPOSIT'
                        ? 'bg-[#06231D] text-white border-[#06231D]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Fixed Deposit (Lump Sum)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcType('RECURRING_DEPOSIT')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      calcType === 'RECURRING_DEPOSIT'
                        ? 'bg-[#06231D] text-white border-[#06231D]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Recurring Deposit (Monthly)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">
                    {calcType === 'RECURRING_DEPOSIT' ? 'Monthly Installment (₹)' : 'Principal Deposit (₹)'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">₹{calcPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="number"
                  step="5000"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">Tenure (Months)</span>
                  <span className="font-mono font-bold text-slate-900">{calcTenure} Months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="120"
                  step="6"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">Annual Base Interest Rate (% p.a.)</span>
                  <span className="font-mono font-bold text-emerald-800">{calcRate}%</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSeniorCitizenCalc}
                    onChange={(e) => setIsSeniorCitizenCalc(e.target.checked)}
                    className="rounded accent-emerald-700"
                  />
                  <span>Senior Citizen Depositor (+0.50% extra interest)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form15GCalc}
                    onChange={(e) => setForm15GCalc(e.target.checked)}
                    className="rounded accent-emerald-700"
                  />
                  <span>Submit Form 15G / 15H (TDS Exemption Declaration)</span>
                </label>
              </div>
            </div>

            {/* Right Output Projections */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Total Maturity Value</span>
                    <div className="text-3xl font-black font-mono text-emerald-800 mt-0.5">
                      ₹{sim.netMaturity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {sim.effectiveRate}% p.a. Compounded
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Total Invested</span>
                    <div className="font-bold text-slate-900 mt-1">
                      ₹{(calcType === 'RECURRING_DEPOSIT' ? calcPrincipal * calcTenure : calcPrincipal).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Interest Earned</span>
                    <div className="font-bold text-emerald-700 mt-1">
                      +₹{sim.interest.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Section 194A TDS</span>
                    <div className={`font-bold mt-1 ${sim.tds > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      -₹{sim.tds.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Mathematical Formula Walkthrough */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 text-xs space-y-1.5 font-mono">
                  <div className="font-bold text-slate-800 font-sans text-xs flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    Auditable Reserve Bank Compounding Formula
                  </div>
                  <p className="text-slate-600 text-[11px] font-sans">
                    Quarterly Compounding Equation: <code className="text-emerald-800 font-mono font-bold">A = P &times; (1 + r/400)^q</code>
                  </p>
                  <p className="text-slate-500 text-[11px] font-sans">
                    Quarters: {Math.floor(calcTenure / 3)} | Quarterly Factor: {(1 + (sim.effectiveRate || calcRate) / 400).toFixed(5)} | TDS Threshold: ₹{isSeniorCitizenCalc ? '50,000' : '40,000'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setFdForm((prev) => ({
                      ...prev,
                      depositType: calcType,
                      depositAmount: calcPrincipal,
                      tenureMonths: calcTenure,
                      isSeniorCitizen: isSeniorCitizenCalc,
                      tdsExemptionForm15G: form15GCalc,
                    }));
                    setIsOpenModalActive(true);
                  }}
                  className="px-6 py-2.5 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Check className="h-4 w-4 text-emerald-400" /> Book Simulated Facility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIQUIDATION & MATURITY HISTORY */}
      {activeTab === 'LIQUIDATION_HISTORY' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Certificate / Customer</th>
                    <th className="px-4 py-3.5">Principal Invested</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Closed / Rolled Date</th>
                    <th className="px-4 py-3.5">Net Payout Credited</th>
                    <th className="px-4 py-3.5">Penalty Deducted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No closed, matured, or liquidated deposits in register.
                      </td>
                    </tr>
                  ) : (
                    paginatedDeposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{dep.customerName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{dep.certificateNumber}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                          ₹{(dep.depositAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              dep.status === 'PREMATURELY_CLOSED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : dep.status === 'AUTO_RENEWED'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {dep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {formatDate(dep.closedAt || dep.maturityDate)}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-800">
                          ₹{(dep.payoutAmount || dep.maturityAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-rose-600">
                          {dep.penaltyDeducted && dep.penaltyDeducted > 0
                            ? `₹${dep.penaltyDeducted.toLocaleString('en-IN')}`
                            : '—'}
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

      {/* MODAL 1: OPEN TERM DEPOSIT */}
      {isOpenModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Book Term Deposit (FD / RD)</h3>
              </div>
              <button
                onClick={() => setIsOpenModalActive(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFD} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitSuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Customer ID</label>
                  <input
                    type="number"
                    value={fdForm.customerId}
                    onChange={(e) => setFdForm({ ...fdForm, customerId: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit Type</label>
                  <select
                    value={fdForm.depositType}
                    onChange={(e) => setFdForm({ ...fdForm, depositType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="FIXED_DEPOSIT">Fixed Deposit (Lump Sum Cumulative)</option>
                    <option value="RECURRING_DEPOSIT">Recurring Deposit (Monthly Savings)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Debit Source Account #</label>
                  <input
                    type="text"
                    value={fdForm.sourceAccountNumber}
                    onChange={(e) => setFdForm({ ...fdForm, sourceAccountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payout Destination Account #</label>
                  <input
                    type="text"
                    value={fdForm.payoutAccountNumber}
                    onChange={(e) => setFdForm({ ...fdForm, payoutAccountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {fdForm.depositType === 'RECURRING_DEPOSIT' ? 'Monthly Installment (₹)' : 'Principal Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={fdForm.depositAmount}
                    onChange={(e) => setFdForm({ ...fdForm, depositAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={fdForm.tenureMonths}
                    onChange={(e) => setFdForm({ ...fdForm, tenureMonths: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Full Name</label>
                  <input
                    type="text"
                    value={fdForm.nomineeName}
                    onChange={(e) => setFdForm({ ...fdForm, nomineeName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nominee Relationship</label>
                  <input
                    type="text"
                    value={fdForm.nomineeRelation}
                    onChange={(e) => setFdForm({ ...fdForm, nomineeRelation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fdForm.isSeniorCitizen}
                    onChange={(e) => setFdForm({ ...fdForm, isSeniorCitizen: e.target.checked })}
                    className="rounded accent-emerald-700"
                  />
                  <span>Senior Citizen (+0.50%)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fdForm.tdsExemptionForm15G}
                    onChange={(e) => setFdForm({ ...fdForm, tdsExemptionForm15G: e.target.checked })}
                    className="rounded accent-emerald-700"
                  />
                  <span>Form 15G/H (0 TDS)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fdForm.autoRenew}
                    onChange={(e) => setFdForm({ ...fdForm, autoRenew: e.target.checked })}
                    className="rounded accent-emerald-700"
                  />
                  <span>Auto-Renewal on Maturity</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpenModalActive(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isSubmitting ? 'Booking & Posting GL...' : 'Confirm Deposit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEPOSIT CERTIFICATE */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Certificate of Term Deposit</h3>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="border-2 border-emerald-900/40 p-8 rounded-2xl bg-white shadow-sm space-y-6 relative">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">APEX NATIONAL BANK</h2>
                    <p className="text-[11px] text-slate-500 font-mono">Certificate of Time Deposit Liability</p>
                    <p className="text-[10px] text-slate-400">Branch: {selectedCertificate.branchName} ({selectedCertificate.branchCode})</p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-slate-900">{selectedCertificate.certificateNumber}</div>
                    <div className="text-slate-500">Date: {formatDate(selectedCertificate.depositDate)}</div>
                    <div className="text-emerald-700 font-semibold">Status: {selectedCertificate.status}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p>This certifies that</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedCertificate.customerName}</p>
                  <p className="font-mono text-slate-500">CIF #{selectedCertificate.customerNumber}</p>
                  <p className="mt-2 text-slate-800">
                    has deposited with Apex National Bank the sum of{' '}
                    <strong className="font-mono text-slate-900 text-sm">
                      ₹{(selectedCertificate.depositPrincipal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    under the <strong className="font-semibold text-emerald-800">{selectedCertificate.productName}</strong>.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/70">
                        <td className="px-4 py-2 font-semibold text-slate-600 w-1/3">Contracted Rate</td>
                        <td className="px-4 py-2 font-mono text-slate-900">
                          {selectedCertificate.interestRate}% per annum (Quarterly Compounding Basis)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold text-slate-600">Maturity Date</td>
                        <td className="px-4 py-2 font-mono text-slate-900">{formatDate(selectedCertificate.maturityDate)}</td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="px-4 py-2 font-semibold text-slate-600">Maturity Amount</td>
                        <td className="px-4 py-2 font-mono font-bold text-emerald-800">
                          ₹{(selectedCertificate.projectedMaturityAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold text-slate-600">Registered Nominee</td>
                        <td className="px-4 py-2 font-mono text-slate-800">
                          {selectedCertificate.nomineeName} ({selectedCertificate.nomineeRelation})
                        </td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="px-4 py-2 font-semibold text-slate-600">Auto-Renewal Flag</td>
                        <td className="px-4 py-2 font-mono text-slate-800">
                          {selectedCertificate.autoRenew ? 'Enabled (Automatic Roll-over)' : 'Disabled'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs text-slate-500">
                  <div>
                    <div className="h-8 w-32 border-b border-dashed border-slate-400 mb-1"></div>
                    <span>{selectedCertificate.authorizedSignatory}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-slate-400">Apex National Bank Core Treasury</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 flex justify-between border-t border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">Issued by Apex National Bank</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Certificate
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="px-4 py-1.5 bg-[#06231D] text-white font-semibold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PREMATURE LIQUIDATION QUOTE */}
      {selectedLiquidationQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-rose-50 px-6 py-4 flex items-center justify-between border-b border-rose-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-700" />
                <h3 className="font-bold text-rose-950 text-base">Premature Deposit Liquidation Quote</h3>
              </div>
              <button
                onClick={() => setSelectedLiquidationQuote(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePrematureLiquidation} className="p-6 space-y-4">
              {liquidationError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{liquidationError}</span>
                </div>
              )}
              {liquidationSuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{liquidationSuccess}</span>
                </div>
              )}

              {selectedLiquidationQuote.isLockInViolated && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs">
                  <span className="font-bold block mb-1">Lock-in Period Violation Warning:</span>
                  <p>{selectedLiquidationQuote.lockInWarningMessage}</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Certificate #:</span>
                  <span className="font-bold text-slate-900">{selectedLiquidationQuote.certificateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Original Principal:</span>
                  <span className="font-bold text-slate-900">
                    ₹{selectedLiquidationQuote.originalPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Contracted vs Penalized Rate:</span>
                  <span>
                    <del className="text-slate-400">{selectedLiquidationQuote.originalInterestRate}%</del>{' '}
                    <strong className="text-rose-700">{selectedLiquidationQuote.revisedPenalizedInterestRate}% p.a.</strong>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Completed Duration:</span>
                  <span className="text-slate-800">{selectedLiquidationQuote.completedMonths} Months</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span className="font-sans">Premature Penalty Deducted:</span>
                  <span className="font-bold">-₹{selectedLiquidationQuote.penaltyAmountDeducted.toLocaleString('en-IN')}</span>
                </div>
                {selectedLiquidationQuote.tdsDeducted > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span className="font-sans">TDS Withheld:</span>
                    <span>-₹{selectedLiquidationQuote.tdsDeducted.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="font-sans font-bold text-slate-900">Net Liquidation Payout:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    ₹{selectedLiquidationQuote.netPayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Premature Liquidation</label>
                <input
                  type="text"
                  value={liquidationReason}
                  onChange={(e) => setLiquidationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgePenalty}
                    onChange={(e) => setAcknowledgePenalty(e.target.checked)}
                    className="mt-0.5 rounded accent-rose-700"
                  />
                  <span>
                    I confirm liquidation of this certificate before maturity and accept the 1.00% premature rate deduction and statutory TDS adjustments.
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedLiquidationQuote(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExecutingLiquidation || !acknowledgePenalty}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isExecutingLiquidation ? 'Liquidating & Posting GL...' : 'Confirm Liquidation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermDepositPage;
