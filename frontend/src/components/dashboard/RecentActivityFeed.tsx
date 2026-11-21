import React from 'react';
import { RecentActivity } from '../../types/dashboard';
import { Clock, FileText } from 'lucide-react';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col h-full">
      <div className="px-5 py-3.5 border-b-2 border-emerald-500 flex items-center justify-between bg-[#0F172A] text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Live Institutional Audit Stream
            </h3>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Real-time compliance activity log across branches
          </p>
        </div>
        <span className="text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-full font-mono font-bold flex items-center space-x-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE AUDIT</span>
        </span>
      </div>

      <div className="divide-y divide-slate-200 overflow-y-auto max-h-[380px]">
        {activities.map((act) => (
          <div key={act.id} className="p-3.5 hover:bg-emerald-50/30 transition flex items-start space-x-3 text-xs border-b border-slate-200">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 mt-0.5 shadow-xs">
              <FileText className="w-4 h-4 text-emerald-800" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 truncate">
                  {act.action}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{act.timestamp}</span>
                </span>
              </div>

              <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-700">
                <span className="font-bold text-slate-900">{act.username}</span>
                <span className="text-slate-400">•</span>
                <span className="px-1.5 py-0.5 bg-slate-200/90 rounded text-[10px] font-mono font-bold text-slate-800 border border-slate-300">
                  {act.userRole}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 truncate font-medium">{act.branchName}</span>
              </div>

              {act.referenceId && (
                <div className="mt-1 text-[10px] font-mono text-slate-600">
                  REF: <span className="text-emerald-900 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{act.referenceId}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
