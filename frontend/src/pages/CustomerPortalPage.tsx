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
  X
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

export const CustomerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [transactions, setTransactions] = useState<RecentTxn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFullAccount, setShowFullAccount] = useState<boolean>(false);

  // Quick Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [destAccount, setDestAccount] = useState<string>('1001000000000002');
  const [destName, setDestName] = useState<string>('Priya Patel');
  const [transferAmount, setTransferAmount] = useState<number>(5000);
  const [transferNarration, setTransferNarration] = useState<string>('Personal Transfer');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [accRes, txnRes] = await Promise.all([
        api.get<ApiResponse<{ content: CustomerAccount[] }>>('/accounts?size=10'),
        api.get<ApiResponse<{ content: RecentTxn[] }>>('/transactions?size=15'),
      ]);
      if (accRes.data?.success && accRes.data.data?.content) {
        setAccounts(accRes.data.data.content);
      }
      if (txnRes.data?.success && txnRes.data.data?.content) {
        setTransactions(txnRes.data.data.content);
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

  const primaryAccount = accounts[0];
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.availableBalance || 0), 0);

  const maskAccount = (num: string) => {
    if (!num || num.length < 8) return num;
    return `•••• •••• •••• ${num.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Apex Online Retail Banking</span>
              <span>•</span>
              <span className="text-emerald-400">KYC Status: Fully Verified</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Welcome back, {user?.fullName || 'Rahul Sharma'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Customer ID: <span className="font-mono text-slate-300">CUST-BLR-001</span> • Domicile: Koramangala Branch, Bangalore (IFSC: APEX0001)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all"
            >
              <Send className="h-4 w-4" /> Send Money Instantly
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Download className="h-4 w-4" /> E-Statement
            </button>
          </div>
        </div>
      </div>

      {/* Account Cards Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Primary Savings Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-900/50 rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                {primaryAccount?.accountType || 'Savings Account'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              ACTIVE
            </span>
          </div>

          <div className="my-6">
            <div className="text-xs text-slate-400 mb-1">Available Ledger Balance</div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              ₹{primaryAccount?.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '1,85,450.00'}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-2">
              <span>
                {showFullAccount
                  ? primaryAccount?.accountNumber || '1001000000000001'
                  : maskAccount(primaryAccount?.accountNumber || '1001000000000001')}
              </span>
              <button
                onClick={() => setShowFullAccount(!showFullAccount)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showFullAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Branch: {primaryAccount?.branchName || 'Koramangala'}</span>
            <span className="text-emerald-400 font-semibold">Interest Rate: 3.50% p.a.</span>
          </div>
        </div>

        {/* Term Deposit Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-900/40 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                Fixed Deposit (FD)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
              7.25% p.a.
            </span>
          </div>

          <div className="my-6">
            <div className="text-xs text-slate-400 mb-1">Principal Invested</div>
            <div className="text-3xl font-bold font-mono text-amber-400 tracking-tight">
              ₹2,00,000.00
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Maturity Value: <span className="font-mono font-bold text-emerald-400">₹2,31,048.00</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Certificate: FD-2026-0001</span>
            <span className="text-slate-300">Matures: 14-Nov-2027</span>
          </div>
        </div>

        {/* Home Loan Advance Widget */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Home Loan Facility
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
              REGULAR
            </span>
          </div>

          <div className="my-6">
            <div className="text-xs text-slate-400 mb-1">Outstanding Principal</div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              ₹44,52,180.00
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Monthly Installment: <span className="font-mono font-bold text-amber-400">₹44,986.00</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>Next EMI Due: 05-Dec-2026</span>
            <span className="text-emerald-400 font-semibold">Auto-Debit Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Transactions & Beneficiaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Personal Statement */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Recent Personal Account Statement
            </h3>
            <button
              onClick={fetchCustomerData}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Date / Reference</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {transactions.slice(0, 8).map((txn) => {
                  const isCredit = txn.transactionType.includes('DEPOSIT') || txn.narration?.toLowerCase().includes('credit');
                  return (
                    <tr key={txn.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="text-slate-400 text-[11px]">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-[10px] text-blue-400">{txn.transactionReference}</div>
                      </td>
                      <td className="px-4 py-3 font-sans text-white text-xs max-w-xs truncate">
                        {txn.narration || txn.transactionType}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-400">{txn.transactionType}</span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold text-sm ${
                          isCredit ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Pay Directory */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              Quick Pay Contacts
            </h3>

            <div className="space-y-2">
              {[
                { name: 'Priya Patel', acc: '1001000000000002', type: 'Savings' },
                { name: 'Vikram Solar Tech', acc: '1001000000000003', type: 'Current' },
                { name: 'Dr. Ananya Roy', acc: '1002000000000001', type: 'Salary' },
              ].map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDestAccount(b.acc);
                    setDestName(b.name);
                    setIsTransferOpen(true);
                  }}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-blue-500/60 rounded-lg cursor-pointer transition-all flex items-center justify-between hover:bg-slate-800/40"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{b.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{b.acc}</div>
                  </div>
                  <button className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[11px] font-semibold transition-all">
                    Pay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Quick Instant Transfer</h3>
              </div>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickTransfer} className="p-6 space-y-4">
              {transferError && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg">
                  {transferError}
                </div>
              )}
              {transferSuccess && (
                <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                  {transferSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Paying Beneficiary</label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <div className="font-bold text-white">{destName}</div>
                  <div className="font-mono text-slate-400 text-[11px]">{destAccount}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount in INR (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono font-bold text-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  value={transferNarration}
                  onChange={(e) => setTransferNarration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md"
                >
                  {isSending ? 'Sending...' : 'Confirm & Transfer'}
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
