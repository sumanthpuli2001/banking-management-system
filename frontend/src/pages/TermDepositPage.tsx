import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
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
  ShieldCheck
} from 'lucide-react';

interface FixedDepositItem {
  id: number;
  depositAccountNumber: string;
  certificateNumber: string;
  customerId: number;
  customerName: string;
  branchName: string;
  principalAmount: number;
  tenureMonths: number;
  interestRate: number;
  maturityAmount: number;
  startDate: string;
  maturityDate: string;
  status: string;
  autoRenew: boolean;
  nomineeName?: string;
  nomineeRelation?: string;
}

export const TermDepositPage: React.FC = () => {
  const [deposits, setDeposits] = useState<FixedDepositItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Interactive Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(200000);
  const [calcTenure, setCalcTenure] = useState<number>(24);
  const [calcRate, setCalcRate] = useState<number>(7.25);
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);

  // Open FD Modal
  const [isOpenModalActive, setIsOpenModalActive] = useState<boolean>(false);
  const [fdForm, setFdForm] = useState({
    customerId: 1,
    sourceAccountNumber: '1001000000000001',
    principalAmount: 100000,
    tenureMonths: 12,
    interestRate: 7.25,
    autoRenew: true,
    nomineeName: 'Anita Sharma',
    nomineeRelation: 'SPOUSE',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Certificate Modal
  const [selectedCertificate, setSelectedCertificate] = useState<FixedDepositItem | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: FixedDepositItem[] }>>('/deposits/term?size=50');
      if (res.data?.success && res.data.data?.content) {
        setDeposits(res.data.data.content);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const calculateMaturity = (p: number, tMonths: number, r: number) => {
    if (p <= 0 || tMonths <= 0) return { maturity: 0, interest: 0 };
    const effectiveRate = isSeniorCitizen ? r + 0.5 : r;
    // Quarterly compound: A = P * (1 + r/400)^(4 * t/12)
    const quarters = (tMonths / 12) * 4;
    const maturity = p * Math.pow(1 + effectiveRate / 400, quarters);
    const roundedMaturity = Math.round(maturity);
    return {
      maturity: roundedMaturity,
      interest: roundedMaturity - p,
    };
  };

  const handleCreateFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/deposits/term', fdForm);
      if (res.data?.success) {
        setIsOpenModalActive(false);
        fetchDeposits();
        if (res.data.data) {
          setSelectedCertificate(res.data.data);
        }
      } else {
        setSubmitError(res.data?.message || 'Failed to open Fixed Deposit');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSubmitError(errorObj.response?.data?.message || 'Error processing fixed deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = deposits.filter((d) =>
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.depositAccountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVolume = deposits.reduce((sum, d) => sum + (d.principalAmount || 0), 0);
  const totalMaturityObligation = deposits.reduce((sum, d) => sum + (d.maturityAmount || 0), 0);

  const calcResult = calculateMaturity(calcPrincipal, calcTenure, calcRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <span>Treasury & Liability Management</span>
            <span>•</span>
            <span>Fixed & Recurring Deposits</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <PiggyBank className="h-7 w-7 text-blue-400" />
            Term Deposits & Investment Portfolio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Term deposit origination, quarterly compounded interest calculation, automated renewal, and certificate vault.
          </p>
        </div>

        <button
          onClick={() => setIsOpenModalActive(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" /> Open New Fixed Deposit
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Fixed Deposit Volume</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Principal deposits held</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Maturity Obligation</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            ₹{totalMaturityObligation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Payable on maturity</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Active Deposit Accounts</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{deposits.length} Accounts</div>
          <div className="text-[11px] text-slate-500 mt-1">Quarterly compounding applied</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Benchmark Card Rate</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">7.25% p.a.</div>
          <div className="text-[11px] text-slate-500 mt-1">+0.50% Senior Citizen booster</div>
        </div>
      </div>

      {/* Interactive FD Yield Calculator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Institutional Term Deposit Yield Simulator</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 cursor-pointer flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={isSeniorCitizen}
                onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span className="text-amber-300 font-semibold">Senior Citizen (+0.50%)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Deposit Principal: <span className="text-white font-mono font-bold">₹{calcPrincipal.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min="10000"
              max="5000000"
              step="10000"
              value={calcPrincipal}
              onChange={(e) => setCalcPrincipal(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Tenure: <span className="text-white font-mono font-bold">{calcTenure} Months</span> ({Math.floor(calcTenure / 12)}y {calcTenure % 12}m)
            </label>
            <input
              type="range"
              min="3"
              max="120"
              step="3"
              value={calcTenure}
              onChange={(e) => setCalcTenure(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Total Maturity Value:</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                ₹{calcResult.maturity.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-400">Net Interest:</div>
              <div className="font-bold font-mono text-amber-400">
                +₹{calcResult.interest.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-400" />
            Active Term Deposit Certificates
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, certificate #..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Certificate # / Customer</th>
                <th className="px-5 py-3.5">Principal Amount</th>
                <th className="px-5 py-3.5">Rate (% p.a.)</th>
                <th className="px-5 py-3.5">Tenure / Maturity Date</th>
                <th className="px-5 py-3.5">Maturity Sum</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Certificate Vault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading term deposit portfolio...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No term deposit certificates found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{item.customerName}</div>
                      <div className="font-mono text-blue-400 text-[11px] mt-0.5">
                        {item.certificateNumber} • {item.depositAccountNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                      ₹{item.principalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[11px]">
                        {item.interestRate}% p.a.
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white font-medium">{item.tenureMonths} Months</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.maturityDate}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{item.maturityAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedCertificate(item)}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-500 text-blue-300 hover:text-white rounded text-xs inline-flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="h-3.5 w-3.5" /> View Certificate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open FD Modal */}
      {isOpenModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Open Fixed Deposit Account</h3>
              </div>
              <button
                onClick={() => setIsOpenModalActive(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFD} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-4 py-2.5 rounded-lg text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Customer ID</label>
                  <input
                    type="number"
                    value={fdForm.customerId}
                    onChange={(e) => setFdForm({ ...fdForm, customerId: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Source Account Number</label>
                  <input
                    type="text"
                    value={fdForm.sourceAccountNumber}
                    onChange={(e) => setFdForm({ ...fdForm, sourceAccountNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Principal Amount (₹)</label>
                  <input
                    type="number"
                    step="1000"
                    value={fdForm.principalAmount}
                    onChange={(e) => setFdForm({ ...fdForm, principalAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white font-mono font-bold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tenure (Months)</label>
                  <select
                    value={fdForm.tenureMonths}
                    onChange={(e) => setFdForm({ ...fdForm, tenureMonths: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                  >
                    <option value={6}>6 Months (6.50% p.a.)</option>
                    <option value={12}>12 Months (7.25% p.a.)</option>
                    <option value={24}>24 Months (7.50% p.a.)</option>
                    <option value={36}>36 Months (7.25% p.a.)</option>
                    <option value={60}>60 Months (7.00% p.a.)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nominee Full Name</label>
                  <input
                    type="text"
                    value={fdForm.nomineeName}
                    onChange={(e) => setFdForm({ ...fdForm, nomineeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nominee Relationship</label>
                  <input
                    type="text"
                    value={fdForm.nomineeRelation}
                    onChange={(e) => setFdForm({ ...fdForm, nomineeRelation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpenModalActive(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md"
                >
                  {isSubmitting ? 'Opening FD...' : 'Issue Fixed Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Certificate of Term Deposit</h3>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Certificate Paper */}
            <div className="p-8 space-y-6 bg-slate-950 text-slate-300 border-4 border-double border-amber-600/30 m-4 rounded-xl">
              <div className="text-center space-y-1 border-b border-dashed border-slate-800 pb-4">
                <div className="text-xl font-bold tracking-widest text-amber-400 uppercase font-serif">
                  APEX BANK OF INDIA
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">
                  Established under the Banking Regulation Act • Head Office
                </div>
                <div className="text-sm font-semibold text-white mt-2">
                  OFFICIAL FIXED DEPOSIT RECEIPT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Certificate No:</span>
                  <div className="font-bold text-white text-sm">{selectedCertificate.certificateNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Deposit Account No:</span>
                  <div className="font-bold text-white text-sm">{selectedCertificate.depositAccountNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Depositor Name:</span>
                  <div className="font-bold text-slate-200">{selectedCertificate.customerName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Domicile Branch:</span>
                  <div className="font-semibold text-slate-200">{selectedCertificate.branchName}</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-400">Principal Amount</span>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    ₹{selectedCertificate.principalAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Rate of Interest</span>
                  <div className="text-base font-bold font-mono text-amber-400 mt-1">
                    {selectedCertificate.interestRate}% p.a.
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Maturity Value</span>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    ₹{selectedCertificate.maturityAmount?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-dashed border-slate-800 pt-3">
                <div>
                  <span className="text-slate-500">Start Date:</span>
                  <div className="text-slate-300">{selectedCertificate.startDate}</div>
                </div>
                <div>
                  <span className="text-slate-500">Maturity Date:</span>
                  <div className="font-bold text-emerald-400">{selectedCertificate.maturityDate}</div>
                </div>
                <div>
                  <span className="text-slate-500">Nominee Registered:</span>
                  <div className="text-slate-300">{selectedCertificate.nomineeName || 'Not Declared'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Renewal Mandate:</span>
                  <div className="text-slate-300">{selectedCertificate.autoRenew ? 'Auto-Renew Principal & Interest' : 'Credit on Maturity'}</div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" /> Digitally Signed & Core Verified
                </div>
                <div className="text-right">
                  <div className="font-serif text-slate-400 italic">For Apex Bank of India</div>
                  <div className="text-[10px] text-slate-500">Authorised Signatory</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-800/80 px-6 py-4 flex gap-3 border-t border-slate-700">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Printer className="h-4 w-4" /> Print Certificate
              </button>
              <button
                onClick={() => setSelectedCertificate(null)}
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
export default TermDepositPage;
