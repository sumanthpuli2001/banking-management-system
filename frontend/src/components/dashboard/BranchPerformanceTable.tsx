import React from 'react';
import { BranchPerformance } from '../../types/dashboard';
import { Building2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slatebank-200 flex items-center justify-between bg-slatebank-50/50">
        <div>
          <h3 className="text-sm font-bold text-slatebank-900 tracking-wide uppercase">
            Branch Network Financial & Compliance Scorecard
          </h3>
          <p className="text-xs text-slatebank-500 mt-0.5">
            Consolidated operational overview across regional bank branches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slatebank-600 bg-white border border-slatebank-200 px-2.5 py-1 rounded-md font-mono">
            {branches.length} Active Nodes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slatebank-100/70 border-b border-slatebank-200 text-slatebank-600 uppercase font-bold tracking-wider">
            <tr>
              <th className="py-3 px-6">Branch Code & Name</th>
              <th className="py-3 px-4">Region</th>
              <th className="py-3 px-4 text-right">Total Deposits</th>
              <th className="py-3 px-4 text-right">Gross Advances</th>
              <th className="py-3 px-4 text-center">Accounts</th>
              <th className="py-3 px-4 text-center">Audit Score</th>
              <th className="py-3 px-6 text-center">Operational Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slatebank-100 font-medium">
            {branches.map((b) => (
              <tr key={b.branchId} className="hover:bg-bank-50/30 transition">
                <td className="py-3.5 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded bg-bank-100 text-bank-800 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slatebank-900">{b.branchName}</div>
                      <div className="text-[10px] text-bank-600 font-mono tracking-wide">
                        {b.branchCode}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slatebank-700">{b.region}</td>
                <td className="py-3.5 px-4 text-right financial-num font-bold text-slatebank-900">
                  {formatCurrency(b.totalDeposits)}
                </td>
                <td className="py-3.5 px-4 text-right financial-num font-bold text-bank-700">
                  {formatCurrency(b.totalAdvances)}
                </td>
                <td className="py-3.5 px-4 text-center financial-num text-slatebank-700">
                  {b.activeAccounts.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      b.complianceScore >= 96
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{b.complianceScore.toFixed(1)}%</span>
                  </span>
                </td>
                <td className="py-3.5 px-6 text-center">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      b.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {b.status === 'ACTIVE' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span>{b.status}</span>
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
