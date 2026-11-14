import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  FileText,
  Lock,
  Unlock,
  Building,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface AccountItem {
  id: number;
  accountNumber: string;
  accountType: string;
  customerId: number;
  customerName: string;
  customerNumber: string;
  branchId: number;
  branchCode: string;
  branchName: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  interestRate: number;
  dailyWithdrawalLimit: number;
  dailyTransferLimit: number;
  openedDate: string;
  freezeReason?: string;
}

interface LedgerItem {
  id: number;
  transactionReference: string;
  accountNumber: string;
  entryType: string;
  amount: number;
  runningBalance: number;
  entryTimestamp: string;
}

export const BankAccountManagementPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Status Action Modal
  const [selectedAccountForStatus, setSelectedAccountForStatus] = useState<AccountItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('FROZEN');
  const [statusReason, setStatusReason] = useState<string>('');

  // Ledger / Statement Drawer
  const [statementAccount, setStatementAccount] = useState<AccountItem | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    customerId: 1,
    branchId: 2,
    accountType: 'SAVINGS',
    initialDeposit: 10000,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: AccountItem[] }>>('/accounts');
      if (res.data.success && res.data.data?.content) {
        setAccounts(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<ApiResponse<AccountItem>>('/accounts', formData);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        fetchAccounts();
        setFormData({
          customerId: 1,
          branchId: 2,
          accountType: 'SAVINGS',
          initialDeposit: 10000,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating account');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForStatus) return;
    try {
      await api.patch(`/accounts/${selectedAccountForStatus.id}/status`, {
        newStatus,
        reason: statusReason,
      });
      setSelectedAccountForStatus(null);
      setStatusReason('');
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const openStatement = async (acc: AccountItem) => {
    setStatementAccount(acc);
    setLedgerLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: LedgerItem[] }>>(
        `/transactions/ledger/${acc.accountNumber}`
      );
      if (res.data.success && res.data.data?.content) {
        setLedgerEntries(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      a.accountNumber.includes(searchTerm) ||
      a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.branchCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slatebank-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bank-100 text-bank-800 border border-bank-200">
              LEDGER CORE
            </span>
            <span className="text-xs text-slatebank-400 font-mono">16-DIGIT ACCOUNT REPOSITORY</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 tracking-tight mt-1">
            Core Deposit & Current Accounts Administration
          </h1>
          <p className="text-xs text-slatebank-500">
            Real-time balance tracking, multi-tier status freeze controls, and double-entry statements
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-bank-900 text-white rounded-xl text-xs font-bold hover:bg-bank-800 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>OPEN NEW BANK ACCOUNT</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slatebank-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by 16-digit account number, customer name, IFSC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slatebank-200 rounded-lg focus:outline-none focus:border-bank-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slatebank-500" />
            <span className="text-slatebank-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slatebank-50 border border-slatebank-200 rounded-lg px-2.5 py-1.5 font-semibold text-slatebank-800 text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DORMANT">DORMANT</option>
              <option value="FROZEN">FROZEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <button
            onClick={fetchAccounts}
            className="p-2 border border-slatebank-200 rounded-lg hover:bg-slatebank-50"
            title="Refresh Accounts"
          >
            <RefreshCw className={`w-4 h-4 text-slatebank-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slatebank-100/70 border-b border-slatebank-200 text-slatebank-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-6">Account Number & Type</th>
                <th className="py-3 px-4">Primary Account Holder</th>
                <th className="py-3 px-4">Branch Domicile</th>
                <th className="py-3 px-4 text-right">Ledger Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slatebank-100 font-medium">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-bank-50/30 transition">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-bank-100 text-bank-800 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slatebank-900 font-mono tracking-wider">
                          {a.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
                        </div>
                        <div className="text-[10px] text-bank-600 font-bold uppercase">
                          {a.accountType} ACCOUNT • {a.interestRate}% P.A.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slatebank-900">{a.customerName}</div>
                    <div className="text-[10px] text-slatebank-400 font-mono">{a.customerNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slatebank-800">{a.branchName}</div>
                    <div className="text-[10px] text-slatebank-400 font-mono">{a.branchCode}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right financial-num font-bold text-slatebank-900 text-sm">
                    {formatCurrency(a.balance)}
                    <span className="block text-[10px] text-slatebank-400 font-normal">
                      Avail: {formatCurrency(a.availableBalance)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : a.status === 'FROZEN'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {a.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>{a.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      onClick={() => openStatement(a)}
                      className="px-2.5 py-1 bg-bank-50 hover:bg-bank-100 text-bank-800 rounded font-semibold text-[11px] transition inline-flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Statement</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccountForStatus(a);
                        setNewStatus(a.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE');
                      }}
                      className="px-2.5 py-1 bg-slatebank-100 hover:bg-slatebank-200 text-slatebank-800 rounded font-semibold text-[11px] transition"
                    >
                      Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Statement Drawer / Modal */}
      {statementAccount && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slatebank-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3">
              <div>
                <h3 className="font-bold text-slatebank-900 text-sm">
                  Official Account Statement & Ledger Audit
                </h3>
                <p className="text-xs text-slatebank-500 font-mono mt-0.5">
                  ACC: {statementAccount.accountNumber} • HOLDER: {statementAccount.customerName}
                </p>
              </div>
              <button onClick={() => setStatementAccount(null)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <div className="bg-bank-950 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slatebank-400 uppercase font-mono">Current Cleared Balance</span>
                <p className="text-xl font-bold financial-num text-white">
                  {formatCurrency(statementAccount.balance)}
                </p>
              </div>
              <div className="text-right font-mono text-xs text-bank-300">
                <p>TYPE: {statementAccount.accountType}</p>
                <p>STATUS: {statementAccount.status}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slatebank-100 rounded-xl p-2">
              {ledgerLoading ? (
                <div className="p-8 text-center text-xs text-slatebank-500 font-mono">
                  Loading cryptographic ledger entries...
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="p-8 text-center text-xs text-slatebank-400">
                  No previous ledger entries on record.
                </div>
              ) : (
                ledgerEntries.map((le) => (
                  <div
                    key={le.id}
                    className="p-3 bg-slatebank-50 hover:bg-slatebank-100 rounded-lg flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          le.entryType === 'CREDIT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {le.entryType === 'CREDIT' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-slatebank-400">
                          {le.transactionReference}
                        </span>
                        <p className="font-semibold text-slatebank-800">
                          {le.entryType === 'CREDIT' ? 'Credit Inflow' : 'Debit Outflow'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold financial-num ${
                          le.entryType === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {le.entryType === 'CREDIT' ? '+' : '-'} {formatCurrency(le.amount)}
                      </p>
                      <span className="text-[10px] text-slatebank-400 financial-num">
                        Bal: {formatCurrency(le.runningBalance)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slatebank-100 flex justify-end">
              <button
                onClick={() => setStatementAccount(null)}
                className="px-4 py-2 bg-slatebank-100 text-slatebank-800 font-semibold rounded-lg text-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Update Modal */}
      {selectedAccountForStatus && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slatebank-200">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3 mb-4">
              <h3 className="font-bold text-slatebank-900 text-sm">
                Alter Account Status: {selectedAccountForStatus.accountNumber}
              </h3>
              <button onClick={() => setSelectedAccountForStatus(null)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slatebank-700 mb-1">New Operational State</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Unrestricted)</option>
                  <option value="DORMANT">DORMANT (Inactivity)</option>
                  <option value="FROZEN">FROZEN (Debit/Credit Freeze)</option>
                  <option value="CLOSED">CLOSED (Permanent Account Termination)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Audit Mandate Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State official reason for freeze, lien, or reactivation..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full p-2 border border-slatebank-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slatebank-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedAccountForStatus(null)}
                  className="px-4 py-2 border border-slatebank-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bank-900 text-white rounded-lg font-bold hover:bg-bank-800"
                >
                  Commit Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slatebank-200">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3 mb-4">
              <h3 className="font-bold text-slatebank-900 text-sm">Open Core Bank Account</h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Customer Identifier (CIF ID)</label>
                <input
                  type="number"
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                  className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  placeholder="e.g. 1"
                />
                <span className="text-[10px] text-slatebank-400">ID 1 = Rahul Sharma, ID 2 = Priya Sundaram</span>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Account Category</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                >
                  <option value="SAVINGS">Savings Account (4.00% P.A.)</option>
                  <option value="CURRENT">Current Commercial Account (0.00%)</option>
                  <option value="SALARY">Corporate Salary Account (4.25% P.A.)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Domicile Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                  className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                >
                  <option value={2}>Apex Commercial Branch, MG Road (BR-BLR-01)</option>
                  <option value={3}>Apex Financial District Branch, BKC (BR-MUM-02)</option>
                  <option value={4}>Apex Connaught Place Branch (BR-DEL-03)</option>
                  <option value={5}>Apex HITEC City Tech Branch (BR-HYD-04)</option>
                  <option value={6}>Apex Marina Commercial Branch (BR-CHN-05)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Initial Cash Deposit (INR)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.initialDeposit}
                  onChange={(e) => setFormData({ ...formData, initialDeposit: Number(e.target.value) })}
                  className="w-full p-2 border border-slatebank-300 rounded font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slatebank-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slatebank-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bank-900 text-white rounded-lg font-bold hover:bg-bank-800"
                >
                  Issue 16-Digit Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
