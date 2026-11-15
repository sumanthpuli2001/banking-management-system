import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ApiResponse } from '../types/auth';
import {
  CreditCard,
  Send,
  Download,
  PiggyBank,
  Eye,
  EyeOff,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
  Plus,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  Search,
  Lock
} from 'lucide-react';

interface CustomerAccount {
  id: number;
  accountNumber: string;
  accountType: string;
  customerName: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  branchName: string;
}

interface RecentTxn {
  id: number;
  transactionReference: string;
  transactionType: string;
  amount: number;
  status: string;
  narration: string;
  createdAt: string;
  sourceAccountNumber?: string;
  destinationAccountNumber?: string;
}

interface TermDepositCard {
  id: number;
  certificateNumber: string;
  depositAmount: number;
  interestRate: number;
  tenureMonths: number;
  maturityAmount: number;
  depositType: string;
  status: string;
  maturityDate: string;
}

interface LoanCard {
  id: number;
  loanAccountNumber: string;
  sanctionedAmount: number;
  outstandingPrincipal: number;
  monthlyEmi: number;
  interestRate: number;
  status: string;
  nextDueDate?: string;
}

export const CustomerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [transactions, setTransactions] = useState<RecentTxn[]>([]);
  const [deposits, setDeposits] = useState<TermDepositCard[]>([]);
  const [loans, setLoans] = useState<LoanCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFullAccount, setShowFullAccount] = useState<boolean>(false);
  const [txnFilter, setTxnFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Quick Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [destAccount, setDestAccount] = useState<string>('1001000000000002');
  const [destName, setDestName] = useState<string>('Priya Patel');
  const [transferAmount, setTransferAmount] = useState<number>(5000);
  const [transferNarration, setTransferNarration] = useState<string>('Personal Transfer');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  // Book Deposit Modal
  const [isBookDepositOpen, setIsBookDepositOpen] = useState<boolean>(false);
  const [depositForm, setDepositForm] = useState({
    depositAmount: 50000,
    tenureMonths: 12,
    depositType: 'FIXED_DEPOSIT',
    autoRenew: true,
    isSeniorCitizen: false,
    nomineeName: 'Anita Sharma',
    nomineeRelation: 'SPOUSE',
  });
  const [isBookingDeposit, setIsBookingDeposit] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<string>('');
  const [depositError, setDepositError] = useState<string>('');

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [accRes, txnRes, depRes, loanRes] = await Promise.allSettled([
        api.get<ApiResponse<{ content: CustomerAccount[] }>>('/accounts?size=10'),
        api.get<ApiResponse<{ content: RecentTxn[] }>>('/transactions?size=25'),
        api.get<ApiResponse<{ content: TermDepositCard[] }>>('/deposits/term?size=10'),
        api.get<ApiResponse<{ content: LoanCard[] }>>('/loans?size=10'),
      ]);

      if (accRes.status === 'fulfilled' && accRes.value.data?.success && accRes.value.data.data?.content) {
        setAccounts(accRes.value.data.data.content);
      }
      if (txnRes.status === 'fulfilled' && txnRes.value.data?.success && txnRes.value.data.data?.content) {
        setTransactions(txnRes.value.data.data.content);
      }
      if (depRes.status === 'fulfilled' && depRes.value.data?.success && depRes.value.data.data?.content) {
        setDeposits(depRes.value.data.data.content);
      }
      if (loanRes.status === 'fulfilled' && loanRes.value.data?.success && loanRes.value.data.data?.content) {
        setLoans(loanRes.value.data.data.content);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryAccount) return;
    setIsSending(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      const idempotencyKey = `CUST-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const res = await api.post('/transactions/transfer', {
        sourceAccountNumber: primaryAccount.accountNumber,
        destinationAccountNumber: destAccount,
        amount: transferAmount,
        transferType: 'INTRA_BANK',
        narration: transferNarration,
        idempotencyKey,
      });

      if (res.data?.success) {
        setTransferSuccess(`Transferred ₹${transferAmount.toLocaleString('en-IN')} successfully!`);
        fetchCustomerData();
        setTimeout(() => {
          setIsTransferOpen(false);
          setTransferSuccess('');
        }, 1500);
      } else {
        setTransferError(res.data?.message || 'Transfer failed');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setTransferError(errorObj.response?.data?.message || 'Transfer rejected by banking engine');
    } finally {
      setIsSending(false);
    }
  };

  const handleBookDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryAccount) return;
    setIsBookingDeposit(true);
    setDepositError('');
    setDepositSuccess('');

    try {
      const payload = {
        customerId: user?.id || 1,
        sourceAccountNumber: primaryAccount.accountNumber,
        depositAmount: depositForm.depositAmount,
        tenureMonths: depositForm.tenureMonths,
        depositType: depositForm.depositType,
        autoRenew: depositForm.autoRenew,
        isSeniorCitizen: depositForm.isSeniorCitizen,
        nomineeName: depositForm.nomineeName,
        nomineeRelation: depositForm.nomineeRelation,
      };

      const res = await api.post('/deposits/term', payload);
      if (res.data?.success) {
        setDepositSuccess('Term deposit booked and certificate generated!');
        fetchCustomerData();
        setTimeout(() => {
          setIsBookDepositOpen(false);
          setDepositSuccess('');
        }, 1500);
      } else {
        setDepositError(res.data?.message || 'Deposit booking failed');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setDepositError(errorObj.response?.data?.message || 'Failed to process term deposit');
    } finally {
      setIsBookingDeposit(false);
    }
  };

  const primaryAccount = accounts[0];
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.availableBalance || 0), 0);
  const primaryDeposit = deposits[0];
  const primaryLoan = loans[0];

  const maskAccount = (num: string) => {
    if (!num || num.length < 8) return num;
    return `•••• •••• •••• ${num.slice(-4)}`;
  };

  const formatDate = (dateVal?: unknown) => {
    if (!dateVal) return '—';
    try {
      if (Array.isArray(dateVal)) {
        const [y, m, d] = dateVal;
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN');
      }
      const dt = new Date(dateVal as string | number);
      return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN');
    } catch {
      return '—';
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (t.transactionReference || '').toLowerCase().includes(term) ||
      (t.narration || '').toLowerCase().includes(term) ||
      (t.transactionType || '').toLowerCase().includes(term);

    const matchesType =
      txnFilter === 'ALL' ||
      (txnFilter === 'CREDIT' && (t.transactionType.includes('DEPOSIT') || (t.narration || '').toLowerCase().includes('credit'))) ||
      (txnFilter === 'DEBIT' && (t.transactionType.includes('WITHDRAWAL') || t.transactionType.includes('TRANSFER') || (t.narration || '').toLowerCase().includes('debit')));

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner / Customer Identification */}
      <div className="bg-[#06231D] border border-emerald-900/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Apex Digital Banking • Verified CIF Tier 1</span>
              <span>•</span>
              <span className="text-emerald-300">RBI Core Banking Regulated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Welcome back, {user?.fullName || 'Rahul Sharma'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              CIF: <strong className="text-emerald-300 font-semibold">{user?.employeeId || 'CIF-100234'}</strong> • Domicile: Koramangala Premier Branch (IFSC: APEX0001)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Send className="h-4 w-4" /> Send Money Instantly
            </button>
            <button
              onClick={() => setIsBookDepositOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all"
            >
              <PiggyBank className="h-4 w-4 text-emerald-400" /> Book Term Deposit
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all"
              title="Print Account Statement"
            >
              <Printer className="h-4 w-4" /> E-Statement
            </button>
          </div>
        </div>
      </div>

      {/* Account Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Primary Savings Account */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono">
                  {primaryAccount?.accountType || 'Savings Bank Account'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="my-5">
              <div className="text-xs text-slate-400 mb-1">Available Ledger Balance</div>
              <div className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                ₹{primaryAccount?.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '1,85,450.00'}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-2">
                <span>
                  {showFullAccount
                    ? primaryAccount?.accountNumber || '1001000000000001'
                    : maskAccount(primaryAccount?.accountNumber || '1001000000000001')}
                </span>
                <button
                  onClick={() => setShowFullAccount(!showFullAccount)}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showFullAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Branch: {primaryAccount?.branchName || 'Koramangala'}</span>
            <span className="text-emerald-700 font-semibold font-mono">Rate: 3.50% p.a.</span>
          </div>
        </div>

        {/* Term Deposit Facility */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-700" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono">
                  {primaryDeposit ? primaryDeposit.depositType.replace('_', ' ') : 'Fixed Deposit (FD)'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {primaryDeposit ? `${primaryDeposit.interestRate}% p.a.` : '7.25% p.a.'}
              </span>
            </div>

            <div className="my-5">
              <div className="text-xs text-slate-400 mb-1">Total Principal Invested</div>
              <div className="text-3xl font-black font-mono text-emerald-800 tracking-tight">
                ₹{primaryDeposit?.depositAmount ? primaryDeposit.depositAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '2,00,000.00'}
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono">
                Maturity Corpus: <strong className="font-bold text-slate-900">
                  ₹{primaryDeposit?.maturityAmount ? primaryDeposit.maturityAmount.toLocaleString('en-IN') : '2,31,048.00'}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="font-mono text-[11px] truncate max-w-[150px]">
              Cert: {primaryDeposit?.certificateNumber || 'FD-BLR001-001'}
            </span>
            <span className="text-slate-700 font-mono text-[11px]">
              Matures: {formatDate(primaryDeposit?.maturityDate) || '14-Nov-2027'}
            </span>
          </div>
        </div>

        {/* Credit Advance / Loan Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-slate-700" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-mono">
                  Prime Home Advance
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                STANDARD (0 DPD)
              </span>
            </div>

            <div className="my-5">
              <div className="text-xs text-slate-400 mb-1">Outstanding Principal Balance</div>
              <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                ₹{primaryLoan?.outstandingPrincipal ? primaryLoan.outstandingPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '44,52,180.00'}
              </div>
              <div className="text-xs text-slate-500 mt-2 font-mono">
                Monthly EMI: <strong className="font-bold text-slate-800">
                  ₹{primaryLoan?.monthlyEmi ? primaryLoan.monthlyEmi.toLocaleString('en-IN') : '44,986.00'}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Next EMI: 05-Dec-2026</span>
            <span className="text-emerald-700 font-semibold">Auto-Debit Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Transactions & Quick Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Statement */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Recent Personal Account Ledger & Statement
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time debits, credits, and electronic settlement records</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by ref, memo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
                {['ALL', 'CREDIT', 'DEBIT'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxnFilter(f)}
                    className={`px-2.5 py-1 text-[10px] font-bold font-mono transition-all ${
                      txnFilter === f
                        ? 'bg-[#06231D] text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold font-mono border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Date / Reference</th>
                  <th className="px-4 py-2.5">Narration</th>
                  <th className="px-4 py-2.5">Transaction Type</th>
                  <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading personal transaction ledger...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No matching transaction entries found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, 10).map((txn) => {
                    const isCredit =
                      txn.transactionType.includes('DEPOSIT') ||
                      (txn.narration || '').toLowerCase().includes('credit');
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="text-slate-500 text-[11px] font-sans">
                            {formatDate(txn.createdAt)}
                          </div>
                          <div className="text-[10px] text-emerald-800 font-mono font-semibold">
                            {txn.transactionReference}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-900 text-xs max-w-xs truncate">
                          {txn.narration || txn.transactionType}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500">{txn.transactionType}</span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold text-sm ${
                            isCredit ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₹{(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Pay Directory */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              Verified Beneficiary Contacts
            </h3>

            <div className="space-y-2.5">
              {[
                { name: 'Priya Patel', acc: '1001000000000002', type: 'Savings Account' },
                { name: 'Vikram Solar Tech', acc: '1001000000000003', type: 'Current Commercial' },
                { name: 'Dr. Ananya Roy', acc: '1002000000000001', type: 'Salary Account' },
              ].map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDestAccount(b.acc);
                    setDestName(b.name);
                    setIsTransferOpen(true);
                  }}
                  className="p-3 bg-slate-50 border border-slate-200 hover:border-emerald-500/60 rounded-2xl cursor-pointer transition-all flex items-center justify-between hover:bg-emerald-50/40"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{b.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{b.acc}</div>
                    <div className="text-[10px] text-slate-400">{b.type}</div>
                  </div>
                  <button className="px-3 py-1 bg-[#06231D] hover:bg-[#047857] text-white rounded-xl text-xs font-semibold shadow-sm transition-all">
                    Pay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK TRANSFER MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Instant Fund Transfer</h3>
              </div>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickTransfer} className="p-6 space-y-4">
              {transferError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{transferError}</span>
                </div>
              )}
              {transferSuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Paying Beneficiary</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="font-bold text-slate-900">{destName}</div>
                  <div className="font-mono text-slate-500 text-[11px]">{destAccount}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Transfer Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-slate-900 font-mono font-bold text-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Remarks</label>
                <input
                  type="text"
                  value={transferNarration}
                  onChange={(e) => setTransferNarration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isSending ? 'Transferring...' : 'Confirm & Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOK DEPOSIT MODAL */}
      {isBookDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Book Term Deposit</h3>
              </div>
              <button
                onClick={() => setIsBookDepositOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookDeposit} className="p-6 space-y-4">
              {depositError && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{depositError}</span>
                </div>
              )}
              {depositSuccess && (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{depositSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={depositForm.depositAmount}
                  onChange={(e) => setDepositForm({ ...depositForm, depositAmount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tenure (Months)</label>
                  <select
                    value={depositForm.tenureMonths}
                    onChange={(e) => setDepositForm({ ...depositForm, tenureMonths: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value={12}>12 Months (7.10% p.a.)</option>
                    <option value={24}>24 Months (7.25% p.a.)</option>
                    <option value={36}>36 Months (7.50% p.a.)</option>
                    <option value={60}>60 Months (7.50% p.a.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit Type</label>
                  <select
                    value={depositForm.depositType}
                    onChange={(e) => setDepositForm({ ...depositForm, depositType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="FIXED_DEPOSIT">Fixed Deposit (FD)</option>
                    <option value="RECURRING_DEPOSIT">Recurring Deposit (RD)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositForm.isSeniorCitizen}
                    onChange={(e) => setDepositForm({ ...depositForm, isSeniorCitizen: e.target.checked })}
                    className="rounded accent-emerald-700"
                  />
                  <span>Senior Citizen (+0.50% p.a. bonus)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositForm.autoRenew}
                    onChange={(e) => setDepositForm({ ...depositForm, autoRenew: e.target.checked })}
                    className="rounded accent-emerald-700"
                  />
                  <span>Auto-renew on maturity</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBookDepositOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingDeposit}
                  className="px-5 py-2 bg-[#06231D] hover:bg-[#047857] text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isBookingDeposit ? 'Booking...' : 'Book Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortalPage;
