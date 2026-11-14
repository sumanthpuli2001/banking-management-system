import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Landmark,
  Layers,
  ArrowRight
} from 'lucide-react';

interface BranchItem {
  id: number;
  branchCode: string;
  name: string;
  ifscCode: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  status: string;
  isHeadOffice: boolean;
  cashVaultBalance: number;
  regionId: number;
  regionName: string;
  employeeCount: number;
  totalDeposits: number;
  totalAdvances: number;
}

export const BranchManagementPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    branchCode: '',
    name: '',
    ifscCode: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    email: '',
    regionId: 1,
    initialVaultBalance: 10000000,
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<BranchItem[]>>('/branches');
      if (res.data.success && res.data.data) {
        setBranches(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch branches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<ApiResponse<BranchItem>>('/branches', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchBranches();
        setFormData({
          branchCode: '',
          name: '',
          ifscCode: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          email: '',
          regionId: 1,
          initialVaultBalance: 10000000,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registering branch');
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/branches/${id}/status?status=${nextStatus}`);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update branch status');
    }
  };

  const filtered = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ifscCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion =
      selectedRegion === 'ALL' || b.regionName.toLowerCase().includes(selectedRegion.toLowerCase());
    return matchesSearch && matchesRegion;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slatebank-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bank-100 text-bank-800 border border-bank-200">
              CORE INFRASTRUCTURE
            </span>
            <span className="text-xs text-slatebank-400 font-mono">MULTI-BRANCH REPOSITORY</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 tracking-tight mt-1">
            Nationwide Branch Operations & Domicile Control
          </h1>
          <p className="text-xs text-slatebank-500">
            Supervise branch routing codes, cash vaults, IFSC mandates, and regional hierarchies
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-bank-900 text-white rounded-xl text-xs font-bold hover:bg-bank-800 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>COMMISSION NEW BRANCH</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slatebank-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by branch name, branch code, IFSC, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slatebank-200 rounded-lg focus:outline-none focus:border-bank-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slatebank-500" />
            <span className="text-slatebank-500 font-medium">Zone:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slatebank-50 border border-slatebank-200 rounded-lg px-2.5 py-1.5 font-semibold text-slatebank-800 text-xs focus:outline-none"
            >
              <option value="ALL">All Zones</option>
              <option value="South">Southern Zone</option>
              <option value="West">Western Zone</option>
              <option value="North">Northern Zone</option>
            </select>
          </div>

          <button
            onClick={fetchBranches}
            className="p-2 border border-slatebank-200 rounded-lg hover:bg-slatebank-50"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 text-slatebank-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slatebank-100/70 border-b border-slatebank-200 text-slatebank-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-6">Branch Code & Name</th>
                <th className="py-3 px-4">IFSC Code</th>
                <th className="py-3 px-4">Regional Zone</th>
                <th className="py-3 px-4 text-right">Cash Vault Liquidity</th>
                <th className="py-3 px-4 text-center">Staff Count</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slatebank-100 font-medium">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-bank-50/30 transition">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-bank-100 text-bank-800 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slatebank-900 flex items-center space-x-2">
                          <span>{b.name}</span>
                          {b.isHeadOffice && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-mono rounded font-bold">
                              HEAD OFFICE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-bank-600 font-mono">
                          {b.branchCode} • {b.city}, {b.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slatebank-800">
                    {b.ifscCode}
                  </td>
                  <td className="py-3.5 px-4 text-slatebank-600">{b.regionName}</td>
                  <td className="py-3.5 px-4 text-right financial-num font-bold text-slatebank-900">
                    {formatCurrency(b.cashVaultBalance)}
                  </td>
                  <td className="py-3.5 px-4 text-center financial-num text-slatebank-700">
                    {b.employeeCount} Officers
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {b.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{b.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      onClick={() => setSelectedBranch(b)}
                      className="px-2.5 py-1 bg-slatebank-100 hover:bg-bank-100 text-bank-800 rounded font-semibold text-[11px] transition"
                    >
                      Details
                    </button>
                    {!b.isHeadOffice && (
                      <button
                        onClick={() => toggleStatus(b.id, b.status)}
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] transition ${
                          b.status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Detail Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slatebank-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-bank-600" />
                <h3 className="font-bold text-slatebank-900">{selectedBranch.name}</h3>
              </div>
              <button
                onClick={() => setSelectedBranch(null)}
                className="text-slatebank-400 hover:text-slatebank-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slatebank-50 p-3 rounded-lg font-mono">
                <div>
                  <span className="text-slatebank-400 text-[10px]">BRANCH CODE:</span>
                  <p className="font-bold text-slatebank-900">{selectedBranch.branchCode}</p>
                </div>
                <div>
                  <span className="text-slatebank-400 text-[10px]">IFSC CODE:</span>
                  <p className="font-bold text-bank-700">{selectedBranch.ifscCode}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slatebank-400 font-bold uppercase text-[10px]">Address & Contact</span>
                <p className="text-slatebank-800">{selectedBranch.address}</p>
                <p className="text-slatebank-800">{selectedBranch.city}, {selectedBranch.state} - {selectedBranch.postalCode}</p>
                <p className="text-slatebank-600">Phone: {selectedBranch.phone} • Email: {selectedBranch.email}</p>
              </div>

              <div className="border-t border-slatebank-100 pt-3 grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-lg">
                  <span className="text-emerald-800 font-bold text-[10px] uppercase">Cash Vault Balance</span>
                  <p className="text-base font-bold text-emerald-900 financial-num mt-1">
                    {formatCurrency(selectedBranch.cashVaultBalance)}
                  </p>
                </div>
                <div className="bg-bank-50/60 border border-bank-100 p-3 rounded-lg">
                  <span className="text-bank-800 font-bold text-[10px] uppercase">Personnel Domiciled</span>
                  <p className="text-base font-bold text-bank-900 financial-num mt-1">
                    {selectedBranch.employeeCount} Officers
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slatebank-100 flex justify-end">
              <button
                onClick={() => setSelectedBranch(null)}
                className="px-4 py-2 bg-slatebank-100 text-slatebank-800 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slatebank-200">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-bank-600" />
                <h3 className="font-bold text-slatebank-900">Register New Commercial Branch</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-PUN-06"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APEX0006001"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Shivaji Nagar Commercial Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slatebank-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="411005"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slatebank-700 mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 12, FC Road, Shivaji Nagar"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slatebank-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-20-25501000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="pune.sn@apexbank.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Regional Zone</label>
                  <select
                    value={formData.regionId}
                    onChange={(e) => setFormData({ ...formData, regionId: Number(e.target.value) })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  >
                    <option value={1}>Southern Regional Office</option>
                    <option value={2}>Western Regional Office</option>
                    <option value={3}>Northern Regional Office</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Initial Vault Liquidity (INR)</label>
                  <input
                    type="number"
                    value={formData.initialVaultBalance}
                    onChange={(e) => setFormData({ ...formData, initialVaultBalance: Number(e.target.value) })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
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
                  Commission Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
