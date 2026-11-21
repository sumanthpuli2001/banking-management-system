import React from 'react';
import { BranchPerformance } from '../../types/dashboard';
import { Landmark, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BranchPerformanceTableProps {
  branches: BranchPerformance[];
}

export const BranchPerformanceTable: React.FC<BranchPerformanceTableProps> = ({ branches }) => {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
      <div className="px-6 py-3.5 border-b-2 border-emerald-500 flex items-center justify-between bg-[#0F172A] text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Branch Network Financial & Compliance Scorecard
            </h3>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Consolidated operational overview across regional bank branches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-3 py-1 rounded-full font-mono font-bold shadow-xs">
            {branches.length} Active Nodes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0F172A] border-b-2 border-emerald-500 text-white uppercase font-extrabold tracking-wider font-mono text-[10px]">
            <tr>
              <th className="py-3 px-5 border-r border-slate-700/80">Branch Code & Name</th>
              <th className="py-3 px-4 border-r border-slate-700/80">Region</th>
              <th className="py-3 px-4 border-r border-slate-700/80 text-right">Total Deposits</th>
              <th className="py-3 px-4 border-r border-slate-700/80 text-right">Gross Advances</th>
              <th className="py-3 px-4 border-r border-slate-700/80 text-center">Accounts</th>
              <th className="py-3 px-4 border-r border-slate-700/80 text-center">Audit Score</th>
              <th className="py-3 px-5 text-center">Operational Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-medium">
            {branches.map((b, idx) => (
              <tr
                key={b.branchId}
                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-emerald-50/40 transition border-b border-slate-300`}
              >
                <td className="py-3.5 px-5 border-r border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-bold text-xs shadow-xs">
                      <Landmark className="w-4 h-4 text-emerald-800" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{b.branchName}</div>
                      <div className="text-[10px] text-emerald-800 font-mono tracking-wide font-bold">
                        {b.branchCode}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 border-r border-slate-200">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/90 text-slate-800 border border-slate-300">
                    {b.region}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono border-r border-slate-200">
                  {formatCurrency(b.totalDeposits)}
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 font-mono border-r border-slate-200">
                  {formatCurrency(b.totalAdvances)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                  {b.activeAccounts.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 text-center border-r border-slate-200">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      b.complianceScore >= 95
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : b.complianceScore >= 90
                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{b.complianceScore}%</span>
                  </span>
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>OPERATIONAL</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
