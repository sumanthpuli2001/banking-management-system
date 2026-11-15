import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  RefreshCw,
  X,
  ShieldAlert,
  Clock,
  Layers,
  Activity,
  ArrowRight,
  Filter,
  Sliders,
  CheckCircle,
  XCircle,
  HelpCircle,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AccountOption {
  id: number;
  accountNumber: string;
  accountType: string;
  customerName: string;
  balance: number;
  availableBalance: number;
  status: string;
}

interface PaymentRailResponse {
  paymentReference: string;
  utrNumber: string | null;
  rrnNumber: string | null;
  railType: 'INTERNAL' | 'NEFT' | 'RTGS' | 'IMPS';
  operatingMode: string;
  status: 'INITIATED' | 'SIMULATED_ACCEPTED' | 'SIMULATED_PENDING' | 'SIMULATED_REJECTED' | 'SIMULATED_TIMEOUT' | 'SETTLED' | 'RECONCILED' | 'FAILED';
  responseCode: string;
  responseMessage: string;
  settlementBatchId: string;
  amount: number;
  fee: number;
  totalDebited: number;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  beneficiaryName: string;
  beneficiaryIfsc: string;
  isDemoSimulated: boolean;
  simulationNotes: string;
  initiatedAt: string;
  settledAt: string | null;
  debitGLAccount: string;
  creditGLAccount: string;
}

interface PaymentRailConfig {
  railType: 'INTERNAL' | 'NEFT' | 'RTGS' | 'IMPS';
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  flatFee: number;
  operatingMode: string;
  batchCycle: string;
  isAvailable: boolean;
  warningNotice: string;
}

export const FundTransferPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
  const [railConfigs, setRailConfigs] = useState<PaymentRailConfig[]>([]);

  // Form State
  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [selectedRail, setSelectedRail] = useState<'INTERNAL' | 'NEFT' | 'RTGS' | 'IMPS'>('NEFT');
  const [destAccount, setDestAccount] = useState<string>('1001000000000002');
  const [destAccountConfirm, setDestAccountConfirm] = useState<string>('1001000000000002');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Priya Patel');
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState<string>('HDFC0001234');
  const [amount, setAmount] = useState<number>(25000);
  const [narration, setNarration] = useState<string>('Invoice Settlement Remittance');

  // Simulation Sandbox Controls
  const [simulatedOutcome, setSimulatedOutcome] = useState<'SUCCESS' | 'PENDING_CLEARING' | 'BENEFICIARY_REJECTED' | 'NETWORK_TIMEOUT'>('SUCCESS');

  // Execution & UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successResult, setSuccessResult] = useState<PaymentRailResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // History & Reconciliation State
  const [history, setHistory] = useState<PaymentRailResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyPage, setHistoryPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [railFilter, setRailFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Reconciliation Modal state
  const [reconcilingRecord, setReconcilingRecord] = useState<PaymentRailResponse | null>(null);
  const [reconcileAction, setReconcileAction] = useState<'SETTLED' | 'FAILED'>('SETTLED');
  const [reconcileRemarks, setReconcileRemarks] = useState<string>('Simulated manual clearing verification completed');
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  useEffect(() => {
    fetchAccounts();
    fetchRailConfigs();
    fetchHistory(0);
  }, []);

  useEffect(() => {
    fetchHistory(0);
  }, [railFilter, statusFilter]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get<ApiResponse<{ content: AccountOption[] }>>('/accounts?size=50');
      if (res.data?.success && res.data.data?.content) {
        setAccounts(res.data.data.content);
        if (res.data.data.content.length > 0 && !sourceAccount) {
          setSourceAccount(res.data.data.content[0].accountNumber);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchRailConfigs = async () => {
    try {
      const res = await api.get<ApiResponse<PaymentRailConfig[]>>('/payments/config');
      if (res.data?.success && res.data.data) {
        setRailConfigs(res.data.data);
      }
    } catch {
      // fallback
    }
  };

  const fetchHistory = async (page: number) => {
    setLoadingHistory(true);
    try {
      const railParam = railFilter !== 'ALL' ? `&railType=${railFilter}` : '';
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const res = await api.get<ApiResponse<{ content: PaymentRailResponse[]; totalPages: number }>>(
        `/payments/history?page=${page}&size=8${railParam}${statusParam}`
      );
      if (res.data?.success && res.data.data) {
        setHistory(res.data.data.content || []);
        setTotalPages(res.data.data.totalPages || 1);
        setHistoryPage(page);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedSourceObj = accounts.find((a) => a.accountNumber === sourceAccount);

  // Dynamic fee calculation based on selected rail
  const calculateEstimatedFee = (amt: number, rail: string): number => {
    if (rail === 'INTERNAL') return 0;
    if (rail === 'IMPS') return 5.0;
    if (rail === 'RTGS') {
      return amt <= 500000 ? 25.0 : 50.0;
    }
    if (rail === 'NEFT') {
      if (amt <= 10000) return 2.5;
      if (amt <= 100000) return 5.0;
      if (amt <= 200000) return 15.0;
      return 25.0;
    }
    return 0;
  };

  const estimatedFee = calculateEstimatedFee(amount, selectedRail);
  const totalDebited = amount + estimatedFee;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sourceAccount) {
      setErrorMsg('Please select a valid source funding account.');
      return;
    }
    if (!destAccount.trim()) {
      setErrorMsg('Please enter beneficiary destination account number.');
      return;
    }
    if (destAccount !== destAccountConfirm) {
      setErrorMsg('Destination account number and confirmation account number do not match.');
      return;
    }
    if (selectedRail === 'INTERNAL' && sourceAccount === destAccount) {
      setErrorMsg('Source and Destination accounts cannot be identical for internal book transfers.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Transfer amount must be greater than zero.');
      return;
    }
    if (selectedRail === 'RTGS' && amount < 200000) {
      setErrorMsg('RTGS requires a minimum transaction amount of ₹2,00,000.00. Use NEFT or IMPS for lower amounts.');
      return;
    }
    if (selectedRail === 'IMPS' && amount > 500000) {
      setErrorMsg('IMPS per-transaction ceiling is ₹5,00,000.00. Please route high-value transfers via RTGS.');
      return;
    }
    if (selectedRail !== 'INTERNAL' && (!beneficiaryIfsc || beneficiaryIfsc.trim().length !== 11)) {
      setErrorMsg('Invalid IFSC code: Must be exactly 11 characters (e.g., HDFC0001234, SBIN0000123).');
      return;
    }
    if (selectedSourceObj && totalDebited > selectedSourceObj.availableBalance) {
      setErrorMsg(
        `Insufficient balance! Total required (Amount + Fee) is ₹${totalDebited.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}, but available balance is ₹${selectedSourceObj.availableBalance.toLocaleString('en-IN')}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const payload = {
        sourceAccountNumber: sourceAccount,
        destinationAccountNumber: destAccount,
        beneficiaryName,
        beneficiaryIfsc: selectedRail === 'INTERNAL' ? 'APEX0001001' : beneficiaryIfsc.trim().toUpperCase(),
        amount,
        railType: selectedRail,
        operatingMode: 'SIMULATION',
        simulatedOutcome,
        narration: narration || 'Electronic Payment',
        idempotencyKey,
      };

      const res = await api.post<ApiResponse<PaymentRailResponse>>('/payments/process', payload);
      if (res.data?.success && res.data.data) {
        setSuccessResult(res.data.data);
        fetchAccounts();
        fetchHistory(0);
      } else {
        setErrorMsg(res.data?.message || 'Payment execution failed.');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(errorObj.response?.data?.message || 'Payment rejected by payment clearing adapter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateReconcile = async () => {
    if (!reconcilingRecord) return;
    setIsReconciling(true);
    try {
      const res = await api.post<ApiResponse<PaymentRailResponse>>(
        `/payments/${reconcilingRecord.paymentReference}/simulate-reconcile`,
        {
          targetStatus: reconcileAction,
          reconciliationRemarks: reconcileRemarks,
        }
      );
      if (res.data?.success && res.data.data) {
        setReconcilingRecord(null);
        fetchHistory(historyPage);
        fetchAccounts();
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert('Reconciliation failed: ' + (errorObj.response?.data?.message || 'Unknown error'));
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
      case 'RECONCILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/70 border border-emerald-500/50 text-emerald-300">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            {status}
          </span>
        );
      case 'SIMULATED_ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-950/70 border border-teal-500/50 text-teal-300">
            <CheckCircle2 className="h-3 w-3 text-teal-400" />
            SIMULATED ACCEPTED
          </span>
        );
      case 'SIMULATED_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/70 border border-amber-500/50 text-amber-300">
            <Clock className="h-3 w-3 text-amber-400 animate-spin" />
            QUEUED / PENDING
          </span>
        );
      case 'SIMULATED_TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-950/70 border border-orange-500/50 text-orange-300">
            <AlertTriangle className="h-3 w-3 text-orange-400" />
            SIMULATED TIMEOUT
          </span>
        );
      case 'SIMULATED_REJECTED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/70 border border-rose-500/50 text-rose-300">
            <XCircle className="h-3 w-3 text-rose-400" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 rounded-xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DEMO / SIMULATION MODE ACTIVE
                </span>
                <span className="text-xs text-slate-400">• High-Fidelity CBS Payment Rail Simulator</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Transactions generate synthetic RBI UTRs, NPCI RRNs, and double-entry general ledger postings in compliance
                with Indian banking regulations. Integration Mode for external RBI/NPCI rails remains safely isolated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400">Operating Mode:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-300">
              SIMULATION (Safe)
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-900/30 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Payment Rail Gateway</span>
            <span>•</span>
            <span>Electronic Clearance & Double-Entry Settlement</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <Send className="h-7 w-7 text-emerald-400" />
            Electronic Payment Rail Switch
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Execute and simulate Apex Internal Book Transfers, NEFT Half-Hourly Batches, RTGS Gross Settlements, and IMPS 24×7 Instant Payments.
          </p>
        </div>

        {/* Live Rail Adapter Health Status */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-900/50 px-4 py-2 rounded-xl text-xs">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <div>
            <span className="text-slate-400">Adapters: </span>
            <span className="font-semibold text-emerald-400">INTERNAL • NEFT • RTGS • IMPS ONLINE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transfer & Simulation Sandbox */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleTransfer} className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-6 space-y-5 shadow-xl">
            {errorMsg && (
              <div className="flex items-center gap-3 text-rose-300 bg-rose-950/60 border border-rose-800 px-4 py-3 rounded-lg text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Source Account */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Source Funding Account <span className="text-rose-400">*</span>
              </label>
              {loadingAccounts ? (
                <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> Loading account list...
                </div>
              ) : (
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountNumber} ({acc.accountType}) — {acc.customerName} | Available: ₹
                      {acc.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              )}

              {selectedSourceObj && (
                <div className="mt-2.5 bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Account Holder:</span>
                    <span className="ml-1.5 font-semibold text-white">{selectedSourceObj.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Available Balance:</span>
                    <span className="ml-1.5 font-mono font-bold text-emerald-400 text-sm">
                      ₹{selectedSourceObj.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Payment Rail Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Select Payment Rail Architecture <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Enforced by Core Banking Adapters</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'INTERNAL' as const,
                    title: 'Apex Internal',
                    tag: 'Book Transfer',
                    desc: 'Intra-bank accounts. Real-time ledger debit/credit.',
                    fee: '₹0 Fee',
                  },
                  {
                    id: 'NEFT' as const,
                    title: 'NEFT Clearing',
                    tag: 'Batch Cycles',
                    desc: 'Half-hourly batch windows. Synthetic 16-char UTR.',
                    fee: 'Tiered ₹2.5 - ₹25',
                  },
                  {
                    id: 'RTGS' as const,
                    title: 'RTGS Gross',
                    tag: 'Min ₹2,00,000',
                    desc: 'High-value gross settlement. Mandatory ₹2L threshold.',
                    fee: '₹25 / ₹50',
                  },
                  {
                    id: 'IMPS' as const,
                    title: 'IMPS 24×7',
                    tag: 'Max ₹5,00,000',
                    desc: 'Instant retail switch. Synthetic 12-digit RRN.',
                    fee: 'Flat ₹5.00',
                  },
                ].map((rail) => (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => {
                      setSelectedRail(rail.id);
                      if (rail.id === 'RTGS' && amount < 200000) {
                        setAmount(250000);
                      }
                      if (rail.id === 'IMPS' && amount > 500000) {
                        setAmount(50000);
                      }
                      if (rail.id === 'INTERNAL') {
                        setBeneficiaryIfsc('APEX0001001');
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      selectedRail === rail.id
                        ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white">{rail.title}</div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          selectedRail === rail.id
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rail.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">{rail.desc}</div>
                    <div className="text-[11px] font-mono font-semibold text-emerald-400 mt-2">{rail.fee}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Beneficiary & Destination Details */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Beneficiary & Destination Clearing Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Priya Patel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Destination IFSC Code {selectedRail === 'INTERNAL' && '(Internal Book)'}
                  </label>
                  <input
                    type="text"
                    value={beneficiaryIfsc}
                    onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                    disabled={selectedRail === 'INTERNAL'}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      selectedRail === 'INTERNAL'
                        ? 'opacity-60 border-slate-800 cursor-not-allowed'
                        : 'border-slate-700'
                    }`}
                    placeholder="e.g. HDFC0001234"
                  />
                  {selectedRail !== 'INTERNAL' && beneficiaryIfsc.length === 11 && (
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Valid 11-digit IFSC structure
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Beneficiary Account Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={destAccount}
                    onChange={(e) => setDestAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter destination account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Confirm Account Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={destAccountConfirm}
                    onChange={(e) => setDestAccountConfirm(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      destAccountConfirm && destAccount !== destAccountConfirm
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-700'
                    }`}
                    placeholder="Re-enter destination account number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 4. Transfer Amount, Purpose & Fee Breakdown */}
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. Transfer Amount & Ledger Debits
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="25000"
                      required
                    />
                  </div>
                  {selectedRail === 'RTGS' && amount < 200000 && (
                    <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> Minimum RTGS transaction is ₹2,00,000
                    </div>
                  )}
                  {selectedRail === 'IMPS' && amount > 500000 && (
                    <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> IMPS maximum ceiling is ₹5,00,000
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Payment Purpose / Narration</label>
                  <input
                    type="text"
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Vendor settlement remittance"
                  />
                </div>
              </div>

              {/* Dynamic Ledger Debit Summary Box */}
              <div className="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400">Transfer Principal:</span>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-slate-600 font-bold">+</div>
                  <div>
                    <span className="text-slate-400">Rail Clearing Fee:</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                      ₹{estimatedFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="sm:border-l sm:border-slate-800 sm:pl-6">
                  <span className="text-slate-400">Total Customer Debit:</span>
                  <div className="font-mono font-bold text-emerald-300 text-base mt-0.5">
                    ₹{totalDebited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Simulation Sandbox Controls */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Clearing Simulation Scenario Sandbox</span>
                </div>
                <span className="text-[10px] text-slate-400">Choose simulated clearing response</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'SUCCESS' as const, label: 'Success (Settled)', color: 'text-emerald-300 border-emerald-500/40' },
                  { id: 'PENDING_CLEARING' as const, label: 'Queue in Batch', color: 'text-amber-300 border-amber-500/40' },
                  { id: 'BENEFICIARY_REJECTED' as const, label: 'Bank Rejection', color: 'text-rose-300 border-rose-500/40' },
                  { id: 'NETWORK_TIMEOUT' as const, label: 'Gateway Timeout', color: 'text-orange-300 border-orange-500/40' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSimulatedOutcome(s.id)}
                    className={`py-2 px-2.5 rounded-lg border text-center text-xs font-medium transition-all ${
                      simulatedOutcome === s.id
                        ? `bg-emerald-900/50 ${s.color} ring-1 ring-emerald-500 font-bold`
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !sourceAccount}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Routing to {selectedRail} Clearing Adapter...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Execute {selectedRail} Simulated Payment of ₹{totalDebited.toLocaleString('en-IN')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Beneficiary Shortcuts & Rail Specs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Beneficiaries Directory */}
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              Verified Beneficiary Shortcuts
            </h3>

            <div className="space-y-2.5">
              {[
                { name: 'Priya Patel', acc: '1001000000000002', ifsc: 'HDFC0001234', bank: 'HDFC Bank', type: 'NEFT / IMPS' },
                { name: 'Reliance Infrastructure Ltd', acc: '9876543210123', ifsc: 'SBIN0000123', bank: 'SBI Commercial', type: 'RTGS Gross' },
                { name: 'Vikram Solar Tech Ltd', acc: '1001000000000003', ifsc: 'APEX0001001', bank: 'Apex Internal', type: 'Intra-Bank' },
                { name: 'Dr. Ananya Roy', acc: '5566778899001', ifsc: 'ICIC0000999', bank: 'ICICI Bank', type: 'IMPS 24×7' },
              ].map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDestAccount(b.acc);
                    setDestAccountConfirm(b.acc);
                    setBeneficiaryName(b.name);
                    setBeneficiaryIfsc(b.ifsc);
                    if (b.type.includes('RTGS')) setSelectedRail('RTGS');
                    else if (b.type.includes('Intra-Bank')) setSelectedRail('INTERNAL');
                    else if (b.type.includes('IMPS')) setSelectedRail('IMPS');
                    else setSelectedRail('NEFT');
                  }}
                  className="p-3 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 rounded-xl cursor-pointer transition-all hover:bg-emerald-950/30 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      {b.name}
                    </div>
                    <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      {b.type}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{b.acc}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {b.bank} • IFSC: {b.ifsc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Rail Protocols Reference */}
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-5 space-y-3.5 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-400" />
              RBI & NPCI Settlement Specifications
            </h4>
            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-slate-200">NEFT Batch Clearing:</span>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Operates in 48 half-hourly batches daily. Generates standardized 16-character UTR (<code className="text-emerald-400 font-mono">APEXN...</code>).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-slate-200">RTGS Real-Time Settlement:</span>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Continuous gross clearing for high-value payments. Mandatory ₹2,00,000 threshold strictly enforced (<code className="text-emerald-400 font-mono">APEXR...</code>).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-slate-200">IMPS 24×7 Instant:</span>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Immediate clearing with 12-digit Retrieval Reference Number (RRN). Per-transaction ceiling capped at ₹5,00,000.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History & Settlement Reconciliation Table */}
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              Payment Rail Transaction History & Simulated Clearing Journal
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit record of all initiated, batched, settled, and simulated payments across payment rail adapters.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={railFilter}
              onChange={(e) => setRailFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">All Rails</option>
              <option value="INTERNAL">Internal Transfer</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="IMPS">IMPS</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SETTLED">Settled</option>
              <option value="SIMULATED_ACCEPTED">Simulated Accepted</option>
              <option value="SIMULATED_PENDING">Queued / Pending</option>
              <option value="SIMULATED_TIMEOUT">Timeout</option>
              <option value="SIMULATED_REJECTED">Rejected</option>
            </select>

            <button
              onClick={() => fetchHistory(historyPage)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] bg-slate-950/40">
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Rail</th>
                <th className="py-3 px-4">UTR / RRN</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loadingHistory ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No payment records found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.paymentReference} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-4 text-emerald-300 font-bold">{record.paymentReference}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-semibold text-white">{record.railType}</span>
                      <div className="text-[10px] text-slate-500">{record.settlementBatchId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {record.utrNumber ? (
                        <div className="flex items-center gap-1.5">
                          <span>{record.utrNumber}</span>
                          <button
                            onClick={() => handleCopy(record.utrNumber!, record.paymentReference + '-utr')}
                            className="text-slate-500 hover:text-emerald-400"
                            title="Copy UTR"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : record.rrnNumber ? (
                        <span>RRN: {record.rrnNumber}</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white">{record.beneficiaryName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {record.destinationAccountNumber} ({record.beneficiaryIfsc})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{record.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      ₹{record.fee?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-sans">{getStatusBadge(record.status)}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      {(record.status === 'SIMULATED_PENDING' || record.status === 'SIMULATED_TIMEOUT') ? (
                        <button
                          onClick={() => setReconcilingRecord(record)}
                          className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition-colors"
                        >
                          Reconcile
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuccessResult(record)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 font-sans">
            <div>
              Page <span className="font-bold text-white">{historyPage + 1}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={historyPage === 0}
                onClick={() => fetchHistory(historyPage - 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={historyPage >= totalPages - 1}
                onClick={() => fetchHistory(historyPage + 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Execution Advice & Settlement Receipt Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-emerald-950/60 px-6 py-4 flex items-center justify-between border-b border-emerald-900/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Payment Settlement Execution Advice</h3>
              </div>
              <button
                onClick={() => setSuccessResult(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-sm">
              {/* Simulation Badge */}
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-3 py-2 text-xs">
                <span className="text-emerald-300 font-bold">DEMO / SIMULATION MODE</span>
                <span className="text-slate-400">Double-Entry Certified</span>
              </div>

              {/* Amount Display */}
              <div className="text-center py-2">
                <div className="text-xs text-slate-400 uppercase font-semibold">Total Debited Amount</div>
                <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                  ₹{successResult.totalDebited?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2">{getStatusBadge(successResult.status)}</div>
              </div>

              {/* Core Attributes */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-sans">Payment Reference:</span>
                  <span className="font-bold text-white">{successResult.paymentReference}</span>
                </div>

                {successResult.utrNumber && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400 font-sans">RBI Clearing UTR:</span>
                    <span className="font-bold text-emerald-300">{successResult.utrNumber}</span>
                  </div>
                )}

                {successResult.rrnNumber && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400 font-sans">NPCI Switch RRN:</span>
                    <span className="font-bold text-emerald-300">{successResult.rrnNumber}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-sans">Settlement Rail:</span>
                  <span className="font-semibold text-white font-sans">{successResult.railType} ({successResult.settlementBatchId})</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-sans">Beneficiary:</span>
                  <span className="font-semibold text-white font-sans">{successResult.beneficiaryName}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-sans">Destination Account:</span>
                  <span className="text-slate-300">{successResult.destinationAccountNumber} ({successResult.beneficiaryIfsc})</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-sans">Transfer Principal / Fee:</span>
                  <span className="text-slate-300">
                    ₹{successResult.amount?.toLocaleString('en-IN')} / ₹{successResult.fee?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Double-Entry Ledger Breakdown */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-[11px] font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">
                  Balanced Double-Entry General Ledger Impact
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>DR {successResult.debitGLAccount || '2010-DEMAND-DEPOSITS-SAVINGS'}</span>
                  <span>₹{successResult.totalDebited?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>CR {successResult.creditGLAccount || '1040-RBI-RESERVE-BALANCE'}</span>
                  <span>₹{successResult.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {successResult.fee > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>CR 4020-FEE-COMMISSION-INCOME</span>
                    <span>₹{successResult.fee?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                <span className="font-semibold text-slate-300">Simulation Note: </span>
                {successResult.simulationNotes}
              </div>

              <button
                onClick={() => setSuccessResult(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 font-bold text-white transition-colors"
              >
                Close Advice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Reconciliation Modal */}
      {reconcilingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-emerald-950/60 px-6 py-4 flex items-center justify-between border-b border-emerald-900/60">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Simulate Clearing Reconciliation</h3>
              </div>
              <button
                onClick={() => setReconcilingRecord(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-400">Payment Ref: </span>
                  <span className="font-bold text-white font-mono">{reconcilingRecord.paymentReference}</span>
                </div>
                <div>
                  <span className="text-slate-400">Current Status: </span>
                  <span className="font-bold text-amber-300">{reconcilingRecord.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Amount: </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ₹{reconcilingRecord.amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Reconciliation Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReconcileAction('SETTLED')}
                    className={`p-2.5 rounded-lg border font-bold text-xs ${
                      reconcileAction === 'SETTLED'
                        ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Confirm Settlement (SETTLED)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReconcileAction('FAILED')}
                    className={`p-2.5 rounded-lg border font-bold text-xs ${
                      reconcileAction === 'FAILED'
                        ? 'bg-rose-900/60 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Clearing Failure & Refund (FAILED)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reconciliation Audit Remarks</label>
                <textarea
                  value={reconcileRemarks}
                  onChange={(e) => setReconcileRemarks(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcilingRecord(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReconciling}
                  onClick={handleSimulateReconcile}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isReconciling ? 'Updating...' : 'Commit Reconciliation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
