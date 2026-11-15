import React from 'react';
import { RecentActivity } from '../../types/dashboard';
import { Clock, FileText } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase font-mono">
            Live Institutional Audit Stream
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time compliance activity log across branches
          </p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE AUDIT</span>
        </span>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
        {activities.map((act) => (
          <div key={act.id} className="p-4 hover:bg-amber-50/20 transition flex items-start space-x-3 text-xs">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 mt-0.5 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">
                  {act.action}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{act.timestamp}</span>
                </span>
              </div>

              <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-600">
                <span className="font-semibold text-amber-900">{act.username}</span>
                <span className="text-slate-300">•</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                  {act.userRole}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 truncate">{act.branchName}</span>
              </div>

              {act.referenceId && (
                <div className="mt-1 text-[10px] font-mono text-slate-500">
                  REF: <span className="text-amber-800 font-semibold">{act.referenceId}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
