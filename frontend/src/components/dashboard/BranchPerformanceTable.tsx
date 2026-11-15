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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase font-mono">
            Branch Network Financial & Compliance Scorecard
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated operational overview across regional bank branches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-mono font-bold">
            {branches.length} Active Nodes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider font-mono text-[10px]">
            <tr>
              <th className="py-3.5 px-6">Branch Code & Name</th>
              <th className="py-3.5 px-4">Region</th>
              <th className="py-3.5 px-4 text-right">Total Deposits</th>
              <th className="py-3.5 px-4 text-right">Gross Advances</th>
              <th className="py-3.5 px-4 text-center">Accounts</th>
              <th className="py-3.5 px-4 text-center">Audit Score</th>
              <th className="py-3.5 px-6 text-center">Operational Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {branches.map((b) => (
              <tr key={b.branchId} className="hover:bg-amber-50/30 transition">
                <td className="py-3.5 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shadow-sm">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{b.branchName}</div>
                      <div className="text-[10px] text-amber-700 font-mono tracking-wide font-semibold">
                        {b.branchCode}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    {b.region}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                  {formatCurrency(b.totalDeposits)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-700 font-mono">
                  {formatCurrency(b.totalAdvances)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                  {b.activeAccounts.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      b.complianceScore >= 95
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : b.complianceScore >= 90
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{b.complianceScore}%</span>
                  </span>
                </td>
                <td className="py-3.5 px-6 text-center">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
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
