import React from 'react';
import { ShieldCheck, Cpu, Sparkles, CheckCircle2, Lock, Fingerprint, Eye } from 'lucide-react';

interface AiSecurityMarkerProps {
  moduleName?: string;
  confidenceScore?: number;
  anomalyScore?: number;
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
  statusText?: string;
  referenceCode?: string;
  className?: string;
}

export const AiSecurityMarker: React.FC<AiSecurityMarkerProps> = ({
  moduleName = 'Core Transaction & Approval Sentinel',
  confidenceScore = 99.8,
  anomalyScore = 0.02,
  riskRating = 'LOW',
  statusText = 'AI Machine Learning Fraud & Compliance Verification Passed',
  referenceCode,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-r from-[#06231D] via-[#0A3329] to-[#041a15] border border-emerald-500/40 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden ${className}`}>
      {/* Background Neural Circuitry Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: AI Crest & Verification Details */}
        <div className="flex items-start gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 via-emerald-800 to-black p-2.5 border border-emerald-400/60 shadow-lg flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-emerald-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-emerald-950 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>APEX AI SENTINEL v4.2</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-200/80">
                • {moduleName}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{statusText}</span>
            </h4>

            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Analyzed via 42 multi-vector neural models across liquidity reserves, Maker-Checker segregation, and FATF/RBI compliance rules.
            </p>

            {referenceCode && (
              <div className="mt-2 text-[11px] font-mono text-emerald-300/90 flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ledger Proof Hash: <strong className="text-white">{referenceCode}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Real-Time AI Metrics Badges */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start md:self-center">
          <div className="bg-black/40 border border-emerald-800/80 rounded-xl px-3.5 py-2 text-center shadow-inner">
            <div className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono">
              {confidenceScore}%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Confidence
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-800/80 rounded-xl px-3.5 py-2 text-center shadow-inner">
            <div className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">
              {anomalyScore}%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Anomaly Risk
            </div>
          </div>

          <div className="bg-emerald-900/50 border border-emerald-500/50 rounded-xl px-3 py-2 text-center shadow-inner">
            <span className="text-[10px] font-bold text-emerald-300 font-mono uppercase block">
              STATUS
            </span>
            <span className="text-xs font-extrabold text-white flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>PASSED</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
