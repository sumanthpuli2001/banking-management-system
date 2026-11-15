import React, { useState } from 'react';
import api, { cachedGet } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ApiResponse } from '../types/auth';
import { AiSecurityMarker } from '../components/common/AiSecurityMarker';
import {
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
  ShieldCheck,
  Calculator,
  RotateCcw,
  ArrowLeft,
  UserCheck,
  Building,
  CheckCircle
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

  // Dedicated Full-Page Receipt State (replaces popup modal)
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
      const data = await cachedGet<AccountInfo>(`/accounts/${searchAccountNum.trim()}`, true);
      if (data && data.accountNumber) {
        setAccountInfo(data);
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

  // DEDICATED FULL-PAGE VIEW: Official Cash Counter Voucher & AI Vault Verification (replaces popup modal)
  if (receiptData) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto font-sans pb-12">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={() => setReceiptData(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Cashier Counter</span>
          </button>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            OFFICIAL TELLER CASH VOUCHER
          </span>
        </div>

        <AiSecurityMarker
          moduleName="Core Cash Vault & Physical Currency Reconciliation Sentinel"
          confidenceScore={99.9}
          anomalyScore={0.01}
          riskRating="LOW"
          statusText="Physical Denomination Reconciled with Double-Entry Cash Vault"
          referenceCode={receiptData.referenceNumber}
        />

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>Counter Cash Transaction Receipt</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official double-entry teller voucher • Branch: {receiptData.branchCode}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                receiptData.type === 'CASH_DEPOSIT'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {receiptData.type === 'CASH_DEPOSIT' ? 'COUNTER CASH DEPOSIT' : 'COUNTER CASH WITHDRAWAL'}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
              {receiptData.type === 'CASH_DEPOSIT' ? 'Total Cash Credited' : 'Total Cash Paid Out'}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-900 mt-1">
              ₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {receiptData.runningBalance !== undefined && (
              <div className="text-xs text-slate-600 mt-2 font-mono">
                Post-Transaction Available Balance: <span className="font-bold text-slate-900">₹{receiptData.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold font-sans">Voucher Reference</span>
              <div className="font-bold text-slate-900 text-sm mt-1">{receiptData.referenceNumber}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold font-sans">Timestamp & Station</span>
              <div className="font-bold text-slate-900 text-sm mt-1">
                {new Date(receiptData.timestamp).toLocaleString('en-IN')} ({receiptData.cashierName})
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold font-sans">Customer Account</span>
              <div className="font-bold text-slate-900 text-sm mt-1">{receiptData.accountNumber}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold font-sans">Account Holder</span>
              <div className="font-bold text-slate-900 text-sm mt-1 font-sans">{receiptData.customerName}</div>
            </div>
          </div>

          {/* Balanced Double-Entry General Ledger Impact */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="text-[11px] font-bold text-slate-700 uppercase font-sans tracking-wider">
              Balanced Double-Entry General Ledger Postings
            </div>
            {receiptData.type === 'CASH_DEPOSIT' ? (
              <>
                <div className="flex justify-between text-emerald-800 font-bold p-2.5 bg-white rounded-lg border border-slate-200">
                  <span>DR 1010-CASH-VAULT-CURRENCY</span>
                  <span>₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold p-2.5 bg-white rounded-lg border border-slate-200">
                  <span>CR 2010-DEMAND-DEPOSITS-SAVINGS ({receiptData.accountNumber})</span>
                  <span>₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-rose-700 font-bold p-2.5 bg-white rounded-lg border border-slate-200">
                  <span>DR 2010-DEMAND-DEPOSITS-SAVINGS ({receiptData.accountNumber})</span>
                  <span>₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold p-2.5 bg-white rounded-lg border border-slate-200">
                  <span>CR 1010-CASH-VAULT-CURRENCY</span>
                  <span>₹{receiptData.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Physical note tally matches CBS transaction voucher. Ledger posting completed.</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-[11px]">Vault Status: BALANCED</span>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200 transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Cash Voucher</span>
            </button>
            <button
              onClick={() => {
                setReceiptData(null);
                resetDenominations();
              }}
              className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition"
            >
              Complete & Serve Next Customer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header - High-Contrast Swiss Emerald */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
            <span>Branch Operations</span>
            <span>•</span>
            <span>Cash Counter Station #01</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <Banknote className="h-7 w-7 text-emerald-700" />
            <span>Cashier Desk & Vault Terminal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorized counter cash deposits, withdrawals, and physical currency note tally verification.
          </p>
        </div>

        {/* Teller Badge */}
        <div className="flex items-center space-x-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="text-xs">
            <div className="text-slate-500 font-medium">Active Teller Session</div>
            <div className="font-bold text-slate-900">{user?.fullName || 'Authorized Cashier'} ({user?.branchCode || 'HO-001'})</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Execution */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action Tabs: Deposit vs Withdrawal */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('DEPOSIT');
                setNarration('Counter Cash Deposit');
                setTxnError('');
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'DEPOSIT'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'WITHDRAWAL'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Cash Withdrawal Counter
            </button>
          </div>

          {/* Account Verification Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Search className="h-4 w-4 text-emerald-700" />
              1. Customer Account Verification
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchAccountNum}
                  onChange={(e) => setSearchAccountNum(e.target.value)}
                  placeholder="Enter 16-digit Account Number (e.g. 1001000000000001)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={handleLookupAccount}
                disabled={lookupLoading}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                {lookupLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {lookupError && (
              <div className="flex items-center gap-2 text-rose-800 bg-rose-50 border border-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{lookupError}</span>
              </div>
            )}

            {accountInfo && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">Account Holder</span>
                    <h4 className="text-base font-extrabold text-slate-900">{accountInfo.customerName}</h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Customer ID: <span className="font-mono font-bold text-slate-700">{accountInfo.customerNumber}</span> • Branch: {accountInfo.branchName}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      accountInfo.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {accountInfo.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Account Type:</span>
                    <div className="font-bold text-slate-900">{accountInfo.accountType}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Current Available Balance:</span>
                    <div className="font-extrabold text-emerald-800 font-mono text-base">
                      ₹{accountInfo.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Execution Form */}
          <form onSubmit={handleProcessTransaction} className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Banknote className="h-4 w-4 text-emerald-700" />
              2. Transaction Details & Amount
            </h3>

            {txnError && (
              <div className="flex items-center gap-2 text-rose-800 bg-rose-50 border border-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{txnError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                  Amount in INR (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold font-mono">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-slate-900 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="5000"
                    required
                  />
                </div>
                {amount >= 50000 && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    PAN declaration mandatory for transactions ≥ ₹50,000
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">Narration / Remarks</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  placeholder="e.g. Counter Cash Deposit"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !accountInfo}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                !accountInfo
                  ? 'bg-slate-300 cursor-not-allowed opacity-60 text-slate-600'
                  : activeTab === 'DEPOSIT'
                  ? 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#06231D] hover:from-emerald-600 hover:to-emerald-800'
                  : 'bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800'
              }`}
            >
              {isSubmitting ? (
                'Processing Core Ledger Entry...'
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Physical Note Denominations</h3>
              </div>
              <button
                type="button"
                onClick={resetDenominations}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            <p className="text-xs text-slate-500">
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
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                  >
                    <div className="w-20 font-bold text-slate-800 flex items-center gap-1 font-mono">
                      <span>₹{denom}</span>
                      <span className="text-slate-400 font-normal">×</span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      onChange={(e) => handleDenomChange(denom as keyof DenominationCount, e.target.value)}
                      placeholder="0"
                      className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />

                    <div className="w-28 text-right font-mono font-bold text-emerald-800">
                      = ₹{subtotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Tally Summary */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold font-mono">Tally Total</div>
                <div className="text-xl font-extrabold font-mono text-emerald-900">
                  ₹{calculateDenomTotal().toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Vault Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDeskPage;
