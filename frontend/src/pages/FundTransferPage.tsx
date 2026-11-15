import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  Send,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  RefreshCw,
  X
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

interface TransferResult {
  transactionReference: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  transferType: string;
  status: string;
  narration: string;
  createdAt: string;
}

export const FundTransferPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);

  // Form State
  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [destAccount, setDestAccount] = useState<string>('1001000000000002');
  const [destAccountConfirm, setDestAccountConfirm] = useState<string>('1001000000000002');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Priya Patel');
  const [amount, setAmount] = useState<number>(25000);
  const [transferType, setTransferType] = useState<string>('INTRA_BANK');
  const [narration, setNarration] = useState<string>('Invoice Settlement');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successResult, setSuccessResult] = useState<TransferResult | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get<ApiResponse<{ content: AccountOption[] }>>('/accounts?size=20');
      if (res.data?.success && res.data.data?.content) {
        setAccounts(res.data.data.content);
        if (res.data.data.content.length > 0) {
          setSourceAccount(res.data.data.content[0].accountNumber);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoadingAccounts(false);
    }
  };

  const selectedSourceObj = accounts.find((a) => a.accountNumber === sourceAccount);

  const isHighValue = amount >= 500000;

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
    if (sourceAccount === destAccount) {
      setErrorMsg('Source and Destination accounts cannot be identical.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Transfer amount must be greater than zero.');
      return;
    }
    if (selectedSourceObj && amount > selectedSourceObj.availableBalance) {
      setErrorMsg(
        `Insufficient balance! Available balance is ₹${selectedSourceObj.availableBalance.toLocaleString('en-IN')}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `TXF-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const payload = {
        sourceAccountNumber: sourceAccount,
        destinationAccountNumber: destAccount,
        amount,
        transferType,
        narration: narration || 'Electronic Fund Transfer',
        idempotencyKey,
      };

      const res = await api.post('/transactions/transfer', payload);
      if (res.data?.success && res.data.data) {
        setSuccessResult(res.data.data);
        // Refresh account balances
        fetchAccounts();
      } else {
        setErrorMsg(res.data?.message || 'Transfer failed.');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(errorObj.response?.data?.message || 'Transaction rejected by core banking ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Payment Settlement Switch</span>
            <span>•</span>
            <span>Real-time Electronic Clearance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <Send className="h-7 w-7 text-blue-400" />
            Electronic Funds Transfer Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Intra-bank book transfers, NEFT, RTGS, and instant IMPS settlement with dual-control Maker-Checker safeguarding.
          </p>
        </div>

        {/* RTGS / NEFT Switch Status */}
        <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
          <div className="text-xs">
            <span className="text-slate-400">Clearing Engine: </span>
            <span className="font-semibold text-emerald-400">ACTIVE & SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleTransfer} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-3 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-4 py-3 rounded-lg text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Source Account Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Source / Debit Account <span className="text-rose-400">*</span>
              </label>
              {loadingAccounts ? (
                <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-400" /> Loading account list...
                </div>
              ) : (
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.accountNumber}>
                      {acc.accountNumber} ({acc.accountType}) — {acc.customerName} | Available: ₹{acc.availableBalance?.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              )}

              {selectedSourceObj && (
                <div className="mt-2.5 bg-slate-950/50 border border-slate-800 rounded-lg p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Account Holder:</span>
                    <span className="ml-1.5 font-semibold text-white">{selectedSourceObj.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Available Balance:</span>
                    <span className="ml-1.5 font-mono font-bold text-emerald-400 text-sm">
                      ₹{selectedSourceObj.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Rails */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Select Settlement Channel
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'INTRA_BANK', title: 'Internal Transfer', desc: 'Apex to Apex (Zero Fee)' },
                  { id: 'IMPS', title: 'IMPS (24×7)', desc: 'Instant up to ₹5,00,000' },
                  { id: 'NEFT', title: 'NEFT Clearing', desc: 'Batched Settlements' },
                  { id: 'RTGS', title: 'RTGS Real-Time', desc: 'High-Value (> ₹2L)' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTransferType(type.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      transferType === type.id
                        ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{type.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Account */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Beneficiary & Destination Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Priya Patel"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Destination IFSC Code</label>
                  <input
                    type="text"
                    defaultValue="APEX0001"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 16-digit account"
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
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Re-enter 16-digit account"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transfer Amount & Remarks */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                4. Transfer Amount & Remarks
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
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="25000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Payment Purpose / Narration</label>
                  <input
                    type="text"
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Supplier Invoice / Vendor Remittance"
                  />
                </div>
              </div>

              {/* High-Value Maker-Checker Alert Banner */}
              {isHighValue && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3.5 flex items-start gap-3 text-xs text-emerald-300">
                  <AlertTriangle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-200">Dual-Control Maker-Checker Safeguard Activated:</span>
                    <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
                      Transactions exceeding ₹5,00,000 will be routed to the <strong>Maker-Checker Approval Hub</strong>.
                      The debit will be authorized and settled once a designated Branch Manager or Head Office Officer reviews and approves the request.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !sourceAccount}
              className={`w-full py-3.5 px-4 rounded-lg font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isHighValue
                  ? 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-900/40'
                  : 'bg-emerald-800 hover:bg-emerald-700 shadow-emerald-900/40'
              }`}
            >
              {isSubmitting ? (
                'Submitting to Core Settlement Engine...'
              ) : isHighValue ? (
                <>
                  <UserCheck className="h-5 w-5" />
                  Queue High-Value Transfer for Approval (₹{amount.toLocaleString('en-IN')})
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Execute Real-Time Transfer of ₹{amount.toLocaleString('en-IN')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Beneficiary Shortcuts & Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Beneficiaries */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-400" />
              Verified Beneficiary Directory
            </h3>

            <div className="space-y-2.5">
              {[
                { name: 'Priya Patel', acc: '1001000000000002', ifsc: 'APEX0001', type: 'Savings' },
                { name: 'Vikram Solar Tech', acc: '1001000000000003', ifsc: 'APEX0001', type: 'Current' },
                { name: 'Dr. Ananya Roy', acc: '1002000000000001', ifsc: 'APEX0002', type: 'Salary' },
              ].map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setDestAccount(b.acc);
                    setDestAccountConfirm(b.acc);
                    setBeneficiaryName(b.name);
                  }}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-blue-500/60 rounded-lg cursor-pointer transition-all hover:bg-slate-800/40"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-xs text-white">{b.name}</div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {b.type}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{b.acc}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">IFSC: {b.ifsc} • Verified Active</div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-400" />
              RBI Settlement Protocols
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>Transactions are processed under pessimistic row locks preventing double-spend anomalies.</li>
              <li>Dual-entry bookkeeping generates balanced debit & credit ledger entries simultaneously.</li>
              <li>Maker-Checker dual authorization mandatory for transfers exceeding ₹5,00,000 threshold.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Receipt Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Payment Execution Advice</h3>
              </div>
              <button
                onClick={() => setSuccessResult(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs bg-slate-950 text-slate-300">
              <div className="text-center border-b border-dashed border-slate-800 pb-3">
                <div className="text-base font-bold text-white tracking-wider">APEX BANK CORE SYSTEM</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ELECTRONIC PAYMENT CLEARING VOUCHER</div>
                <div className="mt-2 inline-block px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-semibold">
                  STATUS: {successResult.status}
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-bold text-white">{successResult.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel / Type:</span>
                  <span className="font-semibold text-blue-400">{successResult.transferType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span>{new Date(successResult.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Debit Account:</span>
                  <span className="font-semibold text-white">{successResult.sourceAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Account:</span>
                  <span className="font-semibold text-white">{successResult.destinationAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span>{beneficiaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Narration:</span>
                  <span>{successResult.narration}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400">TOTAL TRANSFERRED:</span>
                <span className="font-bold text-base text-emerald-400">
                  ₹{successResult.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/80 px-6 py-4 flex gap-3 border-t border-slate-700">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FileText className="h-4 w-4" /> Download Advice
              </button>
              <button
                onClick={() => setSuccessResult(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg text-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FundTransferPage;
