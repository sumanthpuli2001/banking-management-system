import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Construction } from 'lucide-react';

interface PlaceholderModulePageProps {
  moduleName: string;
  description: string;
  targetPhase: string;
  keyFeatures: string[];
}

export const PlaceholderModulePage: React.FC<PlaceholderModulePageProps> = ({
  moduleName,
  description,
  targetPhase,
  keyFeatures,
}) => {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slatebank-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bank-100 text-bank-800 font-bold border border-bank-200">
              {targetPhase}
            </span>
            <span className="text-xs text-slatebank-400 font-mono">CORE SPECIFICATION</span>
          </div>
          <h1 className="text-2xl font-black text-slatebank-900 mt-1">{moduleName}</h1>
          <p className="text-xs text-slatebank-500">{description}</p>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PHASE 1 CORE FOUNDATION ONLINE</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slatebank-200 p-8 shadow-sm space-y-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-bank-50 text-bank-700 rounded-xl border border-bank-200">
            <Construction className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slatebank-900">
              Module Architecture & Planned Implementation
            </h3>
            <p className="text-xs text-slatebank-600 mt-1 leading-relaxed">
              This module is registered within the Apex Banking Core role-permission matrix. Scheduled for comprehensive rollout in {targetPhase}.
            </p>
          </div>
        </div>

        <div className="border-t border-slatebank-100 pt-6">
          <h4 className="text-xs font-bold text-slatebank-800 uppercase tracking-wider mb-3">
            Planned Institutional Workflows & APIs:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-2.5 p-3 rounded-lg bg-slatebank-50 border border-slatebank-200/70 text-xs text-slatebank-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-bank-500 mt-1.5 shrink-0" />
                <span className="font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slatebank-100 pt-4 flex items-center justify-between text-xs text-slatebank-500">
          <span>
            Authorized Operator: <strong className="text-slatebank-800">{user?.fullName}</strong> ({user?.roles?.[0]})
          </span>
          <span className="font-mono text-[11px] text-bank-600">
            Node: {user?.branchCode} • Status: ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};
