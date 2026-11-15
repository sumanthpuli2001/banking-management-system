import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Mail,
  Phone,
  Building
} from 'lucide-react';

interface EmployeeItem {
  id: number;
  employeeCode: string;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  branchId: number;
  branchCode: string;
  branchName: string;
  designation: string;
  department: string;
  salary: number;
  status: string;
  role: string;
}

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Retail Banking',
    role: 'BANK_EMPLOYEE',
    branchId: 2, // Default to BR-BLR-01
    salary: 65000,
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ content: EmployeeItem[] }>>('/employees');
      if (res.data.success && res.data.data?.content) {
        setEmployees(res.data.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<ApiResponse<EmployeeItem>>('/employees', formData);
      if (res.data.success) {
        setIsModalOpen(false);
        fetchEmployees();
        setFormData({
          username: '',
          fullName: '',
          email: '',
          phone: '',
          designation: '',
          department: 'Retail Banking',
          role: 'BANK_EMPLOYEE',
          branchId: 2,
          salary: 65000,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error registering employee');
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/employees/${id}/status?status=${nextStatus}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || e.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const paginatedEmployees = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slatebank-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bank-100 text-bank-800 border border-bank-200">
              STAFF GOVERNANCE
            </span>
            <span className="text-xs text-slatebank-400 font-mono">PERSONNEL & ROLES</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 tracking-tight mt-1">
            Institutional Employee Roster & Role Provisioning
          </h1>
          <p className="text-xs text-slatebank-500">
            Manage bank management, branch managers, cashiers, loan officers, and auditors
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-bank-900 text-white rounded-xl text-xs font-bold hover:bg-bank-800 transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>RECRUIT & ONBOARD OFFICER</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slatebank-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee code, designation, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slatebank-200 rounded-lg focus:outline-none focus:border-bank-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slatebank-500" />
            <span className="text-slatebank-500 font-medium">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slatebank-50 border border-slatebank-200 rounded-lg px-2.5 py-1.5 font-semibold text-slatebank-800 text-xs focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="HEAD_OFFICE_ADMIN">HEAD_OFFICE_ADMIN</option>
              <option value="REGIONAL_MANAGER">REGIONAL_MANAGER</option>
              <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
              <option value="BANK_EMPLOYEE">BANK_EMPLOYEE</option>
              <option value="CASHIER">CASHIER</option>
              <option value="LOAN_OFFICER">LOAN_OFFICER</option>
              <option value="AUDITOR">AUDITOR</option>
            </select>
          </div>

          <button
            onClick={fetchEmployees}
            className="p-2 border border-slatebank-200 rounded-lg hover:bg-slatebank-50"
            title="Refresh Staff Roster"
          >
            <RefreshCw className={`w-4 h-4 text-slatebank-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slatebank-100/70 border-b border-slatebank-200 text-slatebank-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-6">Officer & Employee ID</th>
                <th className="py-3 px-4">Designation & Department</th>
                <th className="py-3 px-4">Branch Domicile</th>
                <th className="py-3 px-4">Role Clearance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slatebank-100 font-medium">
              {paginatedEmployees.map((e) => (
                <tr key={e.id} className="hover:bg-bank-50/30 transition">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-bank-800 text-white flex items-center justify-center font-bold text-xs">
                        {e.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slatebank-900">{e.fullName}</div>
                        <div className="text-[10px] text-bank-600 font-mono">
                          {e.employeeCode} • {e.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slatebank-800">{e.designation}</div>
                    <div className="text-[10px] text-slatebank-400">{e.department}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slatebank-800">{e.branchName}</div>
                    <div className="text-[10px] text-slatebank-400 font-mono">{e.branchCode}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-bank-50 text-bank-800 border border-bank-200 rounded text-[10px] font-mono font-bold">
                      {e.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {e.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{e.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => toggleStatus(e.id, e.status)}
                      className={`px-2.5 py-1 rounded font-semibold text-[11px] transition ${
                        e.status === 'ACTIVE'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {e.status === 'ACTIVE' ? 'Suspend' : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Onboard Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slatebank-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slatebank-200">
            <div className="flex items-center justify-between border-b border-slatebank-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-bank-600" />
                <h3 className="font-bold text-slatebank-900">Recruit & Onboard Banking Officer</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slatebank-400 hover:text-slatebank-600" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Username / Login ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cashier_mum"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="w-full p-2 border border-slatebank-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sandeep Kulkarni"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sandeep.k@apexbank.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-9820011099"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Institutional Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                  >
                    <option value="BANK_EMPLOYEE">BANK_EMPLOYEE</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="LOAN_OFFICER">LOAN_OFFICER</option>
                    <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                    <option value="AUDITOR">AUDITOR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Branch Domicile</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                    className="w-full p-2 border border-slatebank-300 rounded font-semibold"
                  >
                    <option value={1}>Apex Central Head Office (HO-001)</option>
                    <option value={2}>Apex Commercial Branch, MG Road (BR-BLR-01)</option>
                    <option value={3}>Apex Financial District Branch, BKC (BR-MUM-02)</option>
                    <option value={4}>Apex Connaught Place Branch (BR-DEL-03)</option>
                    <option value={5}>Apex HITEC City Tech Branch (BR-HYD-04)</option>
                    <option value={6}>Apex Marina Commercial Branch (BR-CHN-05)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Teller"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slatebank-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Cash Counter & Vault"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 border border-slatebank-300 rounded"
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
                  Confirm Recruitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
