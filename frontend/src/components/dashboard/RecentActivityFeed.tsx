import React from 'react';
import { RecentActivity } from '../../types/dashboard';
import { Clock, FileText, ArrowRight } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-xl border border-slatebank-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slatebank-200 flex items-center justify-between bg-slatebank-50/50">
        <div>
          <h3 className="text-sm font-bold text-slatebank-900 tracking-wide uppercase">
            Live Institutional Audit Stream
          </h3>
          <p className="text-xs text-slatebank-500 mt-0.5">
            Real-time compliance activity log across branches
          </p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-semibold flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE AUDIT</span>
        </span>
      </div>

      <div className="divide-y divide-slatebank-100 overflow-y-auto max-h-[380px]">
        {activities.map((act) => (
          <div key={act.id} className="p-4 hover:bg-slatebank-50/70 transition flex items-start space-x-3 text-xs">
            <div className="p-2 rounded bg-bank-50 text-bank-700 border border-bank-200/50 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slatebank-900 truncate">
                  {act.action}
                </span>
                <span className="text-[10px] text-slatebank-400 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{act.timestamp}</span>
                </span>
              </div>

              <div className="mt-1 flex items-center space-x-2 text-[11px] text-slatebank-600">
                <span className="font-semibold text-bank-800">{act.username}</span>
                <span className="text-slatebank-300">•</span>
                <span className="px-1.5 py-0.2 bg-slatebank-100 rounded text-[10px] font-mono text-slatebank-600">
                  {act.userRole}
                </span>
                <span className="text-slatebank-300">•</span>
                <span className="text-slatebank-500 truncate">{act.branchName}</span>
              </div>

              {act.referenceId && (
                <div className="mt-1 text-[10px] font-mono text-slatebank-500">
                  REF: <span className="text-bank-600">{act.referenceId}</span>
                </div>
              )}
            </div>

            <div className="self-center">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                {act.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slatebank-100 bg-slatebank-50 text-center">
        <button className="text-xs text-bank-600 font-semibold hover:text-bank-800 flex items-center justify-center space-x-1 mx-auto">
          <span>View Complete Immutable Audit Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
