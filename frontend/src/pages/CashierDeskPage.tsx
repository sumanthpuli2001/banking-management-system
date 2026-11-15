import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ApiResponse } from '../types/auth';
import {
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  FileText,
  ShieldCheck,
  Calculator,
  RotateCcw
} from 'lucide-react';

interface AccountInfo {
  accountNumber: string;
  accountType: string;
  customerName: string;
  customerNumber: string;
  balance: number;
  availableBalance: number;
  status: string;
  branchName: string;
}

interface DenominationCount {
  2000: number;
  500: number;
  200: number;
  100: number;
  50: number;
  20: number;
  10: number;
}

export const CashierDeskPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');

  // Account Lookup
  const [searchAccountNum, setSearchAccountNum] = useState<string>('1001000000000001');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string>('');

  // Transaction Form
  const [amount, setAmount] = useState<number>(5000);
  const [narration, setNarration] = useState<string>('Counter Cash Deposit');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [txnError, setTxnError] = useState<string>('');

  // Currency Denomination Counter
  const [denominations, setDenominations] = useState<DenominationCount>({
    2000: 0,
    500: 10,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<{
    referenceNumber: string;
    accountNumber: string;
    customerName: string;
    type: 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL';
    amount: number;
    runningBalance?: number;
    narration: string;
    timestamp: string;
    cashierName: string;
    branchCode: string;
  } | null>(null);

  const calculateDenomTotal = (): number => {
    return (
      (denominations[2000] || 0) * 2000 +
      (denominations[500] || 0) * 500 +
      (denominations[200] || 0) * 200 +
      (denominations[100] || 0) * 100 +
      (denominations[50] || 0) * 50 +
      (denominations[20] || 0) * 20 +
      (denominations[10] || 0) * 10
    );
  };

  const handleDenomChange = (denom: keyof DenominationCount, countStr: string) => {
    const val = parseInt(countStr, 10) || 0;
    const updated = { ...denominations, [denom]: Math.max(0, val) };
    setDenominations(updated);
    
    // Automatically update amount if on deposit tab
    if (activeTab === 'DEPOSIT') {
      const total =
        (updated[2000] || 0) * 2000 +
        (updated[500] || 0) * 500 +
        (updated[200] || 0) * 200 +
        (updated[100] || 0) * 100 +
        (updated[50] || 0) * 50 +
        (updated[20] || 0) * 20 +
        (updated[10] || 0) * 10;
      if (total > 0) setAmount(total);
    }
  };

  const resetDenominations = () => {
    setDenominations({
      2000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
    });
  };

  const handleLookupAccount = async () => {
    if (!searchAccountNum.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await api.get<ApiResponse<AccountInfo>>(`/accounts/${searchAccountNum.trim()}`);
      if (res.data?.success && res.data.data) {
        setAccountInfo(res.data.data);
      } else {
        setLookupError('Account not found in core ledger');
        setAccountInfo(null);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setLookupError(errorObj.response?.data?.message || 'Failed to locate bank account');
      setAccountInfo(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountInfo) {
      setTxnError('Please verify a valid customer bank account first.');
      return;
    }
    if (amount <= 0) {
      setTxnError('Transaction amount must be greater than zero.');
      return;
    }

    if (activeTab === 'WITHDRAWAL' && amount > accountInfo.availableBalance) {
      setTxnError(`Insufficient funds! Available balance is ₹${accountInfo.availableBalance.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);
    setTxnError('');

    try {
      const idempotencyKey = `CSH-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      if (activeTab === 'DEPOSIT') {
        const payload = {
          accountNumber: accountInfo.accountNumber,
          amount,
          narration: narration || 'Cash Counter Deposit',
          cashDenominationsJson: JSON.stringify(denominations),
          idempotencyKey,
        };
        const res = await api.post('/transactions/deposit', payload);
        if (res.data?.success && res.data.data) {
          const txn = res.data.data;
          setReceiptData({
            referenceNumber: txn.transactionReference || idempotencyKey,
            accountNumber: accountInfo.accountNumber,
            customerName: accountInfo.customerName,
            type: 'CASH_DEPOSIT',
            amount,
            runningBalance: (accountInfo.balance || 0) + amount,
            narration: narration || 'Cash Deposit at Counter',
            timestamp: new Date().toISOString(),
            cashierName: user?.fullName || 'Cashier Desk 01',
            branchCode: user?.branchCode || 'APEX0001',
          });
          // Refresh account balance
          handleLookupAccount();
        }
      } else {
        const payload = {
          accountNumber: accountInfo.accountNumber,
          amount,
          narration: narration || 'Cash Counter Withdrawal',
          idempotencyKey,
        };
        const res = await api.post('/transactions/withdraw', payload);
        if (res.data?.success && res.data.data) {
          const txn = res.data.data;
          setReceiptData({
            referenceNumber: txn.transactionReference || idempotencyKey,
            accountNumber: accountInfo.accountNumber,
            customerName: accountInfo.customerName,
            type: 'CASH_WITHDRAWAL',
            amount,
            runningBalance: (accountInfo.balance || 0) - amount,
            narration: narration || 'Cash Withdrawal at Counter',
            timestamp: new Date().toISOString(),
            cashierName: user?.fullName || 'Cashier Desk 01',
            branchCode: user?.branchCode || 'APEX0001',
          });
          // Refresh account balance
          handleLookupAccount();
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setTxnError(errorObj.response?.data?.message || 'Transaction failed to post to core ledger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Branch Operations</span>
            <span>•</span>
            <span>Cash Counter Station #01</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <Banknote className="h-7 w-7 text-blue-400" />
            Cashier Desk & Vault Terminal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authorized counter cash deposits, withdrawals, and physical currency note tally verification.
          </p>
        </div>

        {/* Teller Badge */}
        <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-lg">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div className="text-xs">
            <div className="text-slate-400">Active Teller Session</div>
            <div className="font-semibold text-white">{user?.fullName || 'Authorized Cashier'} ({user?.branchCode || 'HO-001'})</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Execution */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action Tabs: Deposit vs Withdrawal */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-1.5 flex">
            <button
              onClick={() => {
                setActiveTab('DEPOSIT');
                setNarration('Counter Cash Deposit');
                setTxnError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'DEPOSIT'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Cash Deposit Counter
            </button>
            <button
              onClick={() => {
                setActiveTab('WITHDRAWAL');
                setNarration('Counter Cash Withdrawal');
                setTxnError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'WITHDRAWAL'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Cash Withdrawal Counter
            </button>
          </div>

          {/* Account Verification Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" />
              1. Customer Account Verification
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchAccountNum}
                  onChange={(e) => setSearchAccountNum(e.target.value)}
                  placeholder="Enter 16-digit Account Number (e.g. 1001000000000001)"
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleLookupAccount}
                disabled={lookupLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                {lookupLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {lookupError && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-950/30 border border-rose-800/50 px-3.5 py-2.5 rounded-lg text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {accountInfo && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Account Holder</span>
                    <h4 className="text-base font-bold text-white">{accountInfo.customerName}</h4>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Customer ID: <span className="font-mono text-slate-300">{accountInfo.customerNumber}</span> • Branch: {accountInfo.branchName}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      accountInfo.status === 'ACTIVE'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
                    }`}
                  >
                    {accountInfo.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400">Account Type:</span>
                    <div className="font-semibold text-white">{accountInfo.accountType}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Available Balance:</span>
                    <div className="font-bold text-emerald-400 font-mono text-sm">
                      ₹{accountInfo.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Execution Form */}
          <form onSubmit={handleProcessTransaction} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-400" />
              2. Transaction Details & Amount
            </h3>

            {txnError && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-950/30 border border-rose-800/50 px-3.5 py-2.5 rounded-lg text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{txnError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Amount in INR (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                    required
                  />
                </div>
                {amount >= 50000 && (
                  <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    PAN declaration mandatory for transactions ≥ ₹50,000
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Narration / Remarks</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Counter Cash Deposit"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accountInfo}
              className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                !accountInfo
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : activeTab === 'DEPOSIT'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
              }`}
            >
              {isSubmitting ? (
                'Processing Ledger Entry...'
              ) : activeTab === 'DEPOSIT' ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Accept Cash Deposit of ₹{amount.toLocaleString('en-IN')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Dispense Cash Payout of ₹{amount.toLocaleString('en-IN')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Physical Currency Denomination Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Physical Note Denominations</h3>
              </div>
              <button
                type="button"
                onClick={resetDenominations}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter individual currency note counts for physical vault tallying. The computed total will sync with the deposit counter.
            </p>

            {/* Currency Inputs */}
            <div className="space-y-2.5">
              {[2000, 500, 200, 100, 50, 20, 10].map((denom) => {
                const count = denominations[denom as keyof DenominationCount] || 0;
                const subtotal = count * denom;
                return (
                  <div
                    key={denom}
                    className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs"
                  >
                    <div className="w-20 font-bold text-slate-300 flex items-center gap-1 font-mono">
                      <span>₹{denom}</span>
                      <span className="text-slate-500 font-normal">×</span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      onChange={(e) => handleDenomChange(denom as keyof DenominationCount, e.target.value)}
                      placeholder="0"
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-center font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <div className="w-28 text-right font-mono font-semibold text-emerald-400">
                      = ₹{subtotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Tally Summary */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tally Total</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ₹{calculateDenomTotal().toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-700/60 px-2 py-1 rounded">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Vault Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Counter Transaction Receipt</h3>
              </div>
              <button
                onClick={() => setReceiptData(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4 text-xs font-mono bg-slate-950 text-slate-300">
              <div className="text-center border-b border-dashed border-slate-800 pb-3">
                <div className="font-bold text-sm text-white tracking-wider">APEX BANK OF INDIA</div>
                <div className="text-[11px] text-slate-400">CORE BANKING NETWORK • BRANCH: {receiptData.branchCode}</div>
                <div className="text-[10px] text-slate-500 mt-1">OFFICIAL CASH COUNTER VOUCHER</div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref Txn ID:</span>
                  <span className="font-bold text-white">{receiptData.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{new Date(receiptData.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier / Station:</span>
                  <span>{receiptData.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operation:</span>
                  <span className={`font-bold ${receiptData.type === 'CASH_DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {receiptData.type === 'CASH_DEPOSIT' ? 'COUNTER CASH DEPOSIT' : 'COUNTER CASH WITHDRAWAL'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account No:</span>
                  <span className="font-bold text-white">{receiptData.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Holder:</span>
                  <span className="font-semibold text-white">{receiptData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Narration:</span>
                  <span>{receiptData.narration}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400">TRANSACTION AMOUNT:</span>
                <span className="font-bold text-base text-emerald-400">
                  ₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {receiptData.runningBalance !== undefined && (
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Available Balance:</span>
                  <span className="font-semibold text-white">
                    ₹{receiptData.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="text-[10px] text-slate-500 text-center pt-3 border-t border-dashed border-slate-800">
                Double-entry financial ledger updated. Verified by Core Banking Engine.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-800/80 px-6 py-4 flex gap-3 border-t border-slate-700">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CashierDeskPage;
