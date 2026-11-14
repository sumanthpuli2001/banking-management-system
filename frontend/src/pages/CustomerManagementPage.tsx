import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface CustomerItem {
  id: number;
  customerNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  panNumber: string;
  aadhaarNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  kycStatus: string;
  riskCategory: string;
  occupation: string;
  annualIncome: number;
  status: string;
  primaryBranchName: string;
  primaryBranchCode: string;
  accountCount: number;
  totalBalance: number;
}

export const CustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    panNumber: '',
    aadhaarNumber: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    occupation: 'Salaried Professional',
    annualIncome: 1200000,
    primaryBranchId: 2, // MG Road
    riskCategory: 'LOW',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: CustomerItem[] }>>('/customers', {
        params: { query: searchTerm },
      });
      if (res.data.success && res.data.data?.content) {
        setCustomers(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<ApiResponse<CustomerItem>>('/customers', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchCustomers();
        setFormData({
          fullName: '',
          dateOfBirth: '1990-05-15',
          gender: 'Male',
          panNumber: '',
          aadhaarNumber: '',
          email: '',
          phone: '',
          addressLine1: '',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          occupation: 'Salaried Professional',
          annualIncome: 1200000,
          primaryBranchId: 2,
          riskCategory: 'LOW',
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registering customer');
    }
  };

  const updateKyc = async (id: number, status: string) => {
    try {
      await api.patch(`/customers/${id}/kyc?status=${status}`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update KYC');
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slatebank-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bank-100 text-bank-800 border border-bank-200">
              RETAIL & CORPORATE KYC
            </span>
            <span className="text-xs text-slatebank-400 font-mono">CENTRAL IDENTIFICATION FILES (CIF)</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 tracking-tight mt-1">
            Customer Relationship & Identity Verification
          </h1>
          <p className="text-xs text-slatebank-500">
            Regulated KYC onboarding with masked PAN/Aadhaar tokenization and AML risk categorization
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-bank-900 text-white rounded-xl text-xs font-bold hover:bg-bank-800 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>ONBOARD NEW CUSTOMER (KYC)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slatebank-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by full name, CIF number, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slatebank-200 rounded-lg focus:outline-none focus:border-bank-500 font-mono"
          />
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2 border border-slatebank-200 rounded-lg hover:bg-slatebank-50"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 text-slatebank-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Customer Grid / Table */}
      <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slatebank-100/70 border-b border-slatebank-200 text-slatebank-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-6">Customer & CIF Number</th>
                <th className="py-3 px-4">Masked Identity</th>
                <th className="py-3 px-4">Branch Domicile</th>
                <th className="py-3 px-4 text-center">Risk Profile</th>
                <th className="py-3 px-4 text-center">KYC Verification</th>
                <th className="py-3 px-4 text-right">Total Balance</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slatebank-100 font-medium">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-bank-50/30 transition">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slatebank-900">{c.fullName}</div>
                        <div className="text-[10px] text-bank-600 font-mono">
                          {c.customerNumber} • {c.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slatebank-700">
                    <div>PAN: <strong className="text-slatebank-900">{c.panNumber}</strong></div>
                    <div className="text-slatebank-500">UID: {c.aadhaarNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slatebank-800">{c.primaryBranchName}</div>
                    <div className="text-[10px] text-slatebank-400 font-mono">{c.primaryBranchCode}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.riskCategory === 'LOW'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : c.riskCategory === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {c.riskCategory} RISK
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{c.kycStatus}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right financial-num font-bold text-slatebank-900">
                    {formatCurrency(c.totalBalance)}
                    <span className="block text-[10px] text-slatebank-400 font-normal">
                      {c.accountCount} Accounts
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1 bg-slatebank-100 hover:bg-bank-100 text-bank-800 rounded font-semibold text-[11px] transition"
                    >
                      View Dossier
                    </button>
                    {c.kycStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => updateKyc(c.id, 'VERIFIED')}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Dossier Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slatebank-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slatebank-900">Customer KYC Dossier</h3>
              </div>
              <button onClick={() => setSelectedCustomer(null)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slatebank-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slatebank-400 uppercase font-mono">CIF NUMBER</span>
                  <p className="font-bold text-base text-slatebank-900 font-mono">{selectedCustomer.customerNumber}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs font-mono">
                  {selectedCustomer.kycStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slatebank-400 text-[10px] font-bold uppercase">Full Legal Name</span>
                  <p className="font-semibold text-slatebank-900">{selectedCustomer.fullName}</p>
                </div>
                <div>
                  <span className="text-slatebank-400 text-[10px] font-bold uppercase">Date of Birth & Gender</span>
                  <p className="font-semibold text-slatebank-900">{selectedCustomer.dateOfBirth} ({selectedCustomer.gender})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slatebank-50/50 p-2.5 rounded border border-slatebank-100 font-mono">
                <div>
                  <span className="text-slatebank-400 text-[10px]">MASKED PAN:</span>
                  <p className="font-bold text-slatebank-800">{selectedCustomer.panNumber}</p>
                </div>
                <div>
                  <span className="text-slatebank-400 text-[10px]">MASKED AADHAAR:</span>
                  <p className="font-bold text-slatebank-800">{selectedCustomer.aadhaarNumber}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slatebank-400 text-[10px] font-bold uppercase">Permanent Address</span>
                <p className="text-slatebank-700">{selectedCustomer.addressLine1}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.postalCode}</p>
                <p className="text-slatebank-500">Phone: {selectedCustomer.phone} • Email: {selectedCustomer.email}</p>
              </div>

              <div className="border-t border-slatebank-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-slatebank-400 text-[10px] uppercase font-bold">Total Deposited Liquidity</span>
                  <p className="text-base font-bold text-slatebank-900 financial-num mt-0.5">
                    {formatCurrency(selectedCustomer.totalBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slatebank-400 text-[10px] uppercase font-bold">Risk Assessment</span>
                  <p className="font-bold text-xs text-emerald-700">{selectedCustomer.riskCategory} RISK</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slatebank-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slatebank-100 text-slatebank-800 font-semibold rounded-lg text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slatebank-200">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slatebank-900">Onboard New Customer (KYC Registration)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Nair"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2 border border-slatebank-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Aadhaar (12 Digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="123456789012"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh.nair@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-9876543299"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 302, Green Glen Layout, Bellandur"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full p-2 border border-slatebank-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">PIN</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Primary Domicile Branch</label>
                  <select
                    value={formData.primaryBranchId}
                    onChange={(e) => setFormData({ ...formData, primaryBranchId: Number(e.target.value) })}
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
                  <label className="block font-bold text-slatebank-700 mb-1">AML Risk Tier</label>
                  <select
                    value={formData.riskCategory}
                    onChange={(e) => setFormData({ ...formData, riskCategory: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                  >
                    <option value="LOW">LOW Risk</option>
                    <option value="MEDIUM">MEDIUM Risk</option>
                    <option value="HIGH">HIGH Risk (Enhanced Monitoring)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slatebank-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slatebank-300 rounded-lg font-semibold hover:bg-slatebank-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-bank-900 text-white rounded-lg font-bold hover:bg-bank-800 shadow"
                >
                  Confirm KYC Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
