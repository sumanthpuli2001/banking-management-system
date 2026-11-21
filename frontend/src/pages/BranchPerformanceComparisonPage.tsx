import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/dashboard/StatCard';
import {
  Building,
  Landmark,
  TrendingUp,
  ShieldCheck,
  Percent,
  Download,
  Filter,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Award,
  BarChart3,
  Search
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BranchMetric {
  id: number;
  branchCode: string;
  name: string;
  region: 'Central' | 'Southern' | 'Western' | 'Northern';
  totalDepositsCr: number;
  totalAdvancesCr: number;
  cdRatioPct: number;
  grossNpaPct: number;
  activeAccounts: number;
  complianceScore: number;
  cashVaultReserveLakhs: number;
  managerName: string;
  status: 'ONLINE' | 'AUDIT_FLAG';
}

const BRANCH_COMPARISON_DATA: BranchMetric[] = [
  {
    id: 1,
    branchCode: 'HO-001',
    name: 'Apex Central Head Office & Treasury',
    region: 'Central',
    totalDepositsCr: 620.0,
    totalAdvancesCr: 430.0,
    cdRatioPct: 69.35,
    grossNpaPct: 0.95,
    activeAccounts: 5800,
    complianceScore: 98.8,
    cashVaultReserveLakhs: 85.0,
    managerName: 'Rajeshwari Deshmukh',
    status: 'ONLINE'
  },
  {
    id: 2,
    branchCode: 'BLR-001',
    name: 'Bangalore Koramangala Commercial',
    region: 'Southern',
    totalDepositsCr: 410.0,
    totalAdvancesCr: 290.0,
    cdRatioPct: 70.73,
    grossNpaPct: 1.15,
    activeAccounts: 6400,
    complianceScore: 97.4,
    cashVaultReserveLakhs: 48.5,
    managerName: 'Vikramaditya Singhania',
    status: 'ONLINE'
  },
  {
    id: 3,
    branchCode: 'MUM-001',
    name: 'Mumbai Fort Institutional & Forex',
    region: 'Western',
    totalDepositsCr: 350.0,
    totalAdvancesCr: 240.0,
    cdRatioPct: 68.57,
    grossNpaPct: 1.35,
    activeAccounts: 5200,
    complianceScore: 96.9,
    cashVaultReserveLakhs: 62.0,
    managerName: 'Amit Patel',
    status: 'ONLINE'
  },
  {
    id: 4,
    branchCode: 'DEL-001',
    name: 'Delhi Connaught Place Treasury Desk',
    region: 'Northern',
    totalDepositsCr: 280.0,
    totalAdvancesCr: 150.0,
    cdRatioPct: 53.57,
    grossNpaPct: 0.82,
    activeAccounts: 4100,
    complianceScore: 99.2,
    cashVaultReserveLakhs: 40.0,
    managerName: 'Priya Sen',
    status: 'ONLINE'
  },
  {
    id: 5,
    branchCode: 'HYD-001',
    name: 'Hyderabad HITEC City Tech Banking',
    region: 'Southern',
    totalDepositsCr: 185.2,
    totalAdvancesCr: 100.4,
    cdRatioPct: 54.21,
    grossNpaPct: 1.05,
    activeAccounts: 3390,
    complianceScore: 96.5,
    cashVaultReserveLakhs: 32.5,
    managerName: 'Sunita Sharma',
    status: 'ONLINE'
  },
  {
    id: 6,
    branchCode: 'CHN-001',
    name: 'Chennai Anna Salai Industrial',
    region: 'Southern',
    totalDepositsCr: 165.0,
    totalAdvancesCr: 95.2,
    cdRatioPct: 57.70,
    grossNpaPct: 1.42,
    activeAccounts: 2950,
    complianceScore: 97.1,
    cashVaultReserveLakhs: 28.0,
    managerName: 'K. R. Ramanathan',
    status: 'ONLINE'
  }
];

export const BranchPerformanceComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredBranches = BRANCH_COMPARISON_DATA.filter((b) => {
    const matchesRegion = selectedRegion === 'ALL' || b.region.toLowerCase() === selectedRegion.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const chartData = BRANCH_COMPARISON_DATA.map((b) => ({
    name: b.branchCode,
    fullName: b.name,
    Deposits: b.totalDepositsCr,
    Advances: b.totalAdvancesCr,
    CDRatio: b.cdRatioPct,
  }));

  const totalDeposits = BRANCH_COMPARISON_DATA.reduce((acc, b) => acc + b.totalDepositsCr, 0);
  const totalAdvances = BRANCH_COMPARISON_DATA.reduce((acc, b) => acc + b.totalAdvancesCr, 0);
  const avgCdRatio = (totalAdvances / totalDeposits) * 100;
  const avgCompliance =
    BRANCH_COMPARISON_DATA.reduce((acc, b) => acc + b.complianceScore, 0) / BRANCH_COMPARISON_DATA.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-300">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              NATIONAL NETWORK • 6 OPERATIONAL ZONES
            </span>
            <span className="text-xs text-slate-500 font-semibold">RBI Scheduled Commercial Bank</span>
            <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Core Network Active</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Building className="h-7 w-7 text-emerald-800 shrink-0" />
            <span>Branch Performance & Comparative Analytics Hub</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Cross-branch balance sheet benchmarking, deposit-to-advance ratios, asset quality rankings, and statutory audit compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-300 shadow-sm transition-all text-xs font-bold"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export Benchmark PDF</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/branches')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md transition-all border border-emerald-900"
          >
            <span>Manage Branches</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Comparative Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Consolidated Branch Deposits"
          value={`₹${totalDeposits.toFixed(2)} Cr`}
          subtitle="Cumulative deposits across 6 active branches"
          icon={Landmark}
          color="emerald"
          trend="+8.4% YoY"
          trendUp={true}
        />
        <StatCard
          title="Consolidated Bank Advances"
          value={`₹${totalAdvances.toFixed(2)} Cr`}
          subtitle="Total sanctioned loans & credit exposure"
          icon={TrendingUp}
          color="blue"
          trend="+12.1% YoY"
          trendUp={true}
        />
        <StatCard
          title="Average Credit-Deposit Ratio"
          value={`${avgCdRatio.toFixed(2)}%`}
          subtitle="Prudential RBI benchmark: 65% – 75%"
          icon={Percent}
          color="teal"
          trend="Healthy Liquidity"
          trendUp={true}
        />
        <StatCard
          title="Network Compliance Score"
          value={`${avgCompliance.toFixed(1)}%`}
          subtitle="RBI KYC, AML & Statutory reserve audit"
          icon={ShieldCheck}
          color="navy"
          trend="Grade A+ Certified"
          trendUp={true}
        />
      </div>

      {/* Comparative Bar Chart: Deposits vs Advances by Branch */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <span>Branch Balance Sheet Comparison (Deposits vs Advances in ₹ Crores)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consolidated positions reported by central general ledger clearance corridors.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              Deposits (₹ Cr)
            </span>
            <span className="flex items-center gap-1.5 text-blue-800">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              Advances (₹ Cr)
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit=" Cr" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                }}
                formatter={(val: any) => [`₹${val} Cr`, '']}
              />
              <Bar dataKey="Deposits" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={45} />
              <Bar dataKey="Advances" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Performance Comparison Ranking Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden space-y-0">
        {/* Table Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Filter Region:</span>
            {['ALL', 'Central', 'Southern', 'Western', 'Northern'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedRegion === reg
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search branch code, name, manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 font-medium"
            />
          </div>
        </div>

        {/* High-Contrast Branch Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Branch Code & Name</th>
                <th className="py-3.5 px-4">Region</th>
                <th className="py-3.5 px-4 text-right">Deposits (₹ Cr)</th>
                <th className="py-3.5 px-4 text-right">Advances (₹ Cr)</th>
                <th className="py-3.5 px-4 text-center">CD Ratio</th>
                <th className="py-3.5 px-4 text-center">Gross NPA</th>
                <th className="py-3.5 px-4 text-center">Compliance</th>
                <th className="py-3.5 px-4 text-center">CBS Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="font-extrabold text-slate-900">{branch.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Code: <span className="font-bold text-slate-700">{branch.branchCode}</span> • Mgr:{' '}
                      <span className="text-slate-700">{branch.managerName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {branch.region}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      ₹{branch.totalDepositsCr.toFixed(2)} Cr
                    </span>
                    <div className="w-24 ml-auto mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(branch.totalDepositsCr / 620) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-bold text-blue-800 text-sm">
                      ₹{branch.totalAdvancesCr.toFixed(2)} Cr
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 text-slate-900 border border-slate-300">
                      {branch.cdRatioPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                        branch.grossNpaPct < 1.0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : branch.grossNpaPct < 1.5
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {branch.grossNpaPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-xs">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{branch.complianceScore}%</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>ONLINE</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
