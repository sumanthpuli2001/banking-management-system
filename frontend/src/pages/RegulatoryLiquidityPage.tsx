import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import {
  ShieldCheck,
  Scale,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Layers,
  Settings,
  Sliders,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
  Info,
  Building,
  CheckSquare,
  Landmark
} from 'lucide-react';

interface NdtlBreakdown {
  calculationDate: string;
  reportingFortnight: string;
  savingsAccountDeposits: number;
  currentAccountDeposits: number;
  overdueDepositsAndMargins: number;
  totalDemandLiabilities: number;
  fixedDepositLiabilities: number;
  recurringDepositLiabilities: number;
  totalTimeLiabilities: number;
  otherDemandTimeLiabilities: number;
  grossDemandTimeLiabilities: number;
  interbankAssetsBalances: number;
  netInterBranchClearing: number;
  totalExemptions: number;
  netDemandTimeLiabilities: number;
  regulatoryFormulasApplied: string[];
  centralBankCircularReference: string;
}

interface CrrMonitoring {
  asOfDate: string;
  reportingFortnight: string;
  ndtlAmount: number;
  prescribedCrrRate: number;
  minimumDailyMaintenancePct: number;
  requiredCrrAmount: number;
  minimumDailyRequiredAmount: number;
  actualBalanceWithRbi: number;
  surplusDeficitAmount: number;
  actualMaintenancePct: number;
  complianceStatus: string;
  compliant: boolean;
  statutoryRuleReference: string;
  notes: string;
}

interface EligibleAsset {
  id: number;
  assetIdentifier: string;
  assetName: string;
  assetType: string;
  faceValue: number;
  bookValue: number;
  marketValue: number;
  couponRate: number;
  maturityDate: string;
  isEncumbered: boolean;
  custodyDepository: string;
  valuationDate: string;
}

interface SlrMonitoring {
  asOfDate: string;
  reportingFortnight: string;
  ndtlAmount: number;
  prescribedSlrRate: number;
  requiredSlrAmount: number;
  centralGovtSecuritiesValue: number;
  stateDevLoansValue: number;
  treasuryBillsValue: number;
  physicalVaultCashValue: number;
  excessCrrBalanceWithRbi: number;
  sovereignGoldValue: number;
  totalEligibleLiquidAssets: number;
  actualSlrMaintenancePct: number;
  surplusDeficitAmount: number;
  complianceStatus: string;
  compliant: boolean;
  statutoryRuleReference: string;
  qualifyingSecurities: EligibleAsset[];
  notes: string;
}

interface RegulatoryConfig {
  id: number;
  parameterKey: string;
  parameterName: string;
  parameterValue: number;
  unit: string;
  effectiveDate: string;
  sourceCircularReference: string;
  description: string;
  isActive: boolean;
  updatedBy: string;
}

interface LiquidityAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  metricObserved: string;
  regulatoryThreshold: string;
  isAcknowledged: boolean;
  createdTimestamp: string;
}

interface CalculationHistoryItem {
  id: number;
  reportingFortnight: string;
  calculationDate: string;
  netDemandTimeLiabilities: number;
  crrRateApplied: number;
  crrRequiredAmount: number;
  crrActualMaintained: number;
  crrSurplusDeficit: number;
  crrComplianceStatus: string;
  slrRateApplied: number;
  slrRequiredAmount: number;
  slrActualMaintained: number;
  slrSurplusDeficit: number;
  slrComplianceStatus: string;
  calculationClassification: string;
  isRegulatoryVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  calculatedBy: string;
}

interface RegulatoryDashboardData {
  asOfDate: string;
  activeReportingPeriod: string;
  calculationClassification: string;
  isRegulatoryVerified: boolean;
  complianceBadgeTitle: string;
  ndtlAmount: number;
  ndtlBreakdown: NdtlBreakdown;
  crrPosition: CrrMonitoring;
  slrPosition: SlrMonitoring;
  totalLiquidReserves: number;
  compositeReserveRatio: number;
  liquidAssets: EligibleAsset[];
  activeAlerts: LiquidityAlert[];
  regulatoryConfigs: RegulatoryConfig[];
  recentCalculations: CalculationHistoryItem[];
}

export const RegulatoryLiquidityPage: React.FC = () => {
  const [data, setData] = useState<RegulatoryDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NDTL' | 'CRR' | 'SLR' | 'ASSETS' | 'CONFIG' | 'STRESS'>('OVERVIEW');

  // Modals
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [selectedConfig, setSelectedConfig] = useState<RegulatoryConfig | null>(null);
  const [newConfigValue, setNewConfigValue] = useState<number>(0);
  const [newConfigDate, setNewConfigDate] = useState<string>('');
  const [newConfigRef, setNewConfigRef] = useState<string>('');

  // Stress Testing / Simulation Form
  const [stressDepositDrain, setStressDepositDrain] = useState<number>(5);
  const [simCrrRate, setSimCrrRate] = useState<number>(4.5);
  const [simSlrRate, setSimSlrRate] = useState<number>(18.0);
  const [simNotes, setSimNotes] = useState<string>('Q4 Liquidity Stress Scenario: 5% Deposit Outflow');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Sign off state
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<RegulatoryDashboardData>>('/regulatory/dashboard');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;
    try {
      const res = await api.put<ApiResponse<RegulatoryConfig>>('/regulatory/config', {
        parameterKey: selectedConfig.parameterKey,
        parameterValue: newConfigValue,
        effectiveDate: newConfigDate,
        sourceCircularReference: newConfigRef,
        description: selectedConfig.description,
      });
      if (res.data?.success) {
        setShowConfigModal(false);
        fetchDashboard();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update regulatory configuration.');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await api.post('/regulatory/simulate', {
        customCrrRate: simCrrRate,
        customSlrRate: simSlrRate,
        stressScenarioDepositDrainPct: stressDepositDrain,
        simulationNotes: simNotes,
      });
      if (res.data?.success) {
        fetchDashboard();
        setActiveTab('OVERVIEW');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSignOff = async (calculationId: number) => {
    setIsSigningOff(true);
    try {
      const res = await api.post(`/regulatory/verify/${calculationId}`);
      if (res.data?.success) {
        fetchDashboard();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Verification sign-off failed.');
    } finally {
      setIsSigningOff(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await api.post(`/regulatory/alerts/${alertId}/acknowledge`);
      fetchDashboard();
    } catch {
      // ignore
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm">Loading Institutional Regulatory & Liquidity Engine...</p>
      </div>
    );
  }

  const ndtl = data?.ndtlBreakdown;
  const crr = data?.crrPosition;
  const slr = data?.slrPosition;

  return (
    <div className="space-y-6">
      {/* Top Compliance Classification Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                    data?.isRegulatoryVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {data?.isRegulatoryVerified ? 'AUDITED STATUTORY COMPLIANT' : 'SIMULATED REGULATORY VALIDATION'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  REPORTING FORTNIGHT: {data?.activeReportingPeriod}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Central Reserve & Liquidity Supervisory Matrix
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Section 42 of Reserve Bank of India Act, 1934 (CRR) and Section 24 of Banking Regulation Act, 1949 (SLR).
                Calculated strictly on dynamically classified balance-sheet demand & time liabilities.
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-end justify-between gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Composite Reserve Ratio</span>
              <div className="text-2xl font-mono font-extrabold text-emerald-400">
                {data?.compositeReserveRatio?.toFixed(2)}%
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
              NDTL Base: ₹{(data?.ndtlAmount ? (data.ndtlAmount / 10000000).toFixed(2) : 0)} Cr
            </div>
          </div>
        </div>
      </div>

      {/* Active Liquidity Alerts */}
      {data?.activeAlerts && data.activeAlerts.length > 0 && (
        <div className="space-y-2">
          {data.activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                alert.severity === 'CRITICAL_DEFICIT'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                  : 'bg-amber-950/60 border-amber-800 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <div className="font-bold">{alert.title}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">{alert.description}</div>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledgeAlert(alert.id)}
                className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 font-bold shrink-0 transition"
              >
                Acknowledge Alert
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-900/40 pb-3">
        {[
          { id: 'OVERVIEW' as const, label: 'Executive Matrix', icon: Scale },
          { id: 'NDTL' as const, label: 'NDTL Calculation Breakdown', icon: Layers },
          { id: 'CRR' as const, label: 'CRR Monitoring (Sec 42)', icon: Landmark },
          { id: 'SLR' as const, label: 'SLR Monitoring (Sec 24)', icon: Building },
          { id: 'ASSETS' as const, label: 'Eligible Liquid Assets', icon: FileText },
          { id: 'CONFIG' as const, label: 'Regulatory Rate Parameters', icon: Settings },
          { id: 'STRESS' as const, label: 'Stress Simulation Sandbox', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-900/60 border border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Main Ratio Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: NDTL */}
            <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Net Demand & Time Liabilities</span>
                <Layers className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                ₹{(data?.ndtlAmount ? (data.ndtlAmount / 10000000).toFixed(2) : '0')} Cr
              </div>
              <div className="text-[11px] text-slate-400">
                Demand: ₹{(ndtl?.totalDemandLiabilities ? (ndtl.totalDemandLiabilities / 10000000).toFixed(1) : '0')} Cr • Time: ₹
                {(ndtl?.totalTimeLiabilities ? (ndtl.totalTimeLiabilities / 10000000).toFixed(1) : '0')} Cr
              </div>
              <button
                onClick={() => setActiveTab('NDTL')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
              >
                Inspect Derivation <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Card 2: CRR Position */}
            <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>CRR Cash Reserve Ratio</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    crr?.compliant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {crr?.complianceStatus}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {crr?.actualMaintenancePct?.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">Req: {crr?.prescribedCrrRate?.toFixed(2)}%</span>
              </div>
              <div className="text-[11px] text-slate-400">
                RBI Bal: ₹{(crr?.actualBalanceWithRbi ? (crr.actualBalanceWithRbi / 10000000).toFixed(2) : 0)} Cr • Surplus: +₹
                {(crr?.surplusDeficitAmount ? (crr.surplusDeficitAmount / 10000000).toFixed(2) : 0)} Cr
              </div>
              <button
                onClick={() => setActiveTab('CRR')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
              >
                CRR Details & Rules <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Card 3: SLR Position */}
            <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>SLR Statutory Liquidity</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    slr?.compliant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {slr?.complianceStatus}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {slr?.actualSlrMaintenancePct?.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">Req: {slr?.prescribedSlrRate?.toFixed(2)}%</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Eligible Assets: ₹{(slr?.totalEligibleLiquidAssets ? (slr.totalEligibleLiquidAssets / 10000000).toFixed(2) : 0)} Cr •
                Buffer: +₹{(slr?.surplusDeficitAmount ? (slr.surplusDeficitAmount / 10000000).toFixed(2) : 0)} Cr
              </div>
              <button
                onClick={() => setActiveTab('SLR')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
              >
                SLR Securities Portfolio <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Card 4: Total Liquid Assets */}
            <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Total Liquid Reserves</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                ₹{(data?.totalLiquidReserves ? (data.totalLiquidReserves / 10000000).toFixed(2) : 0)} Cr
              </div>
              <div className="text-[11px] text-slate-400">
                Sovereign G-Secs, T-Bills, RBI balances, and cash drawers fully backing customer deposits
              </div>
              <button
                onClick={() => setActiveTab('ASSETS')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-1"
              >
                View Asset Holdings <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Historical Reserve Calculations & Statutory Sign-off */}
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  Reserve Calculation Audit History & Regulatory Sign-Off
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological record of reserve ratios and official statutory certifications.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] bg-slate-950/40 font-mono">
                    <th className="py-3 px-4">Fortnight</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">NDTL Base</th>
                    <th className="py-3 px-4">CRR (Req / Act)</th>
                    <th className="py-3 px-4">SLR (Req / Act)</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {data?.recentCalculations && data.recentCalculations.length > 0 ? (
                    data.recentCalculations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/40 transition">
                        <td className="py-3 px-4 font-bold text-emerald-400">{item.reportingFortnight}</td>
                        <td className="py-3 px-4 text-slate-300">{item.calculationDate}</td>
                        <td className="py-3 px-4 text-white">₹{(item.netDemandTimeLiabilities / 10000000).toFixed(2)} Cr</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400">{item.crrRateApplied}% / </span>
                          <span className="font-bold text-emerald-300">
                            ₹{(item.crrActualMaintained / 10000000).toFixed(2)} Cr
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400">{item.slrRateApplied}% / </span>
                          <span className="font-bold text-emerald-300">
                            ₹{(item.slrActualMaintained / 10000000).toFixed(2)} Cr
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {item.calculationClassification}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {item.isRegulatoryVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Audited
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-400">Simulated</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          {!item.isRegulatoryVerified && (
                            <button
                              disabled={isSigningOff}
                              onClick={() => handleSignOff(item.id)}
                              className="px-2.5 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition disabled:opacity-50"
                            >
                              Sign Off
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                        No previous reserve calculations logged. Run a calculation via the Stress Simulation tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NDTL DERIVATION */}
      {activeTab === 'NDTL' && ndtl && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              Net Demand & Time Liabilities (NDTL) Classification Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Statutory computation under Section 42(1) of the RBI Act. Liabilities are derived directly from customer accounts and balance-sheet general ledger codes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Demand Liabilities */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
              <div className="font-bold text-emerald-400 font-sans text-sm flex items-center justify-between border-b border-slate-800 pb-2">
                <span>1. Demand Liabilities</span>
                <span>₹{(ndtl.totalDemandLiabilities / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400 font-sans">Savings Account Deposits (GL 2010):</span>
                <span className="text-white">₹{ndtl.savingsAccountDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400 font-sans">Current Account Deposits (GL 2020):</span>
                <span className="text-white">₹{ndtl.currentAccountDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Overdue Deposits & Unclaimed Margins:</span>
                <span className="text-white">₹{ndtl.overdueDepositsAndMargins.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Time Liabilities */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
              <div className="font-bold text-emerald-400 font-sans text-sm flex items-center justify-between border-b border-slate-800 pb-2">
                <span>2. Time Liabilities</span>
                <span>₹{(ndtl.totalTimeLiabilities / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400 font-sans">Fixed Term Deposits (GL 2030):</span>
                <span className="text-white">₹{ndtl.fixedDepositLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Recurring Deposits (GL 2040):</span>
                <span className="text-white">₹{ndtl.recurringDepositLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Other Liabilities & Deductions */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
              <div className="font-bold text-emerald-400 font-sans text-sm flex items-center justify-between border-b border-slate-800 pb-2">
                <span>3. Other Demand & Time Liabilities (ODTL)</span>
                <span>₹{(ndtl.otherDemandTimeLiabilities / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Borrowings & Unadjusted Clearings:</span>
                <span className="text-white">₹{ndtl.otherDemandTimeLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Exemptions */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3 font-mono">
              <div className="font-bold text-emerald-400 font-sans text-sm flex items-center justify-between border-b border-slate-800 pb-2">
                <span>4. Interbank Exemptions (Deductions)</span>
                <span className="text-rose-400">-₹{(ndtl.totalExemptions / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400 font-sans">Balances Due from Other Banks:</span>
                <span className="text-white">₹{ndtl.interbankAssetsBalances.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Inter-Branch In-Transit Netting:</span>
                <span className="text-white">₹{ndtl.netInterBranchClearing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Final Net NDTL Result */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold font-sans">
                Computed Net Demand and Time Liabilities (NDTL) Base
              </span>
              <div className="text-3xl font-extrabold text-emerald-300 mt-1">
                ₹{ndtl.netDemandTimeLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 font-sans mt-0.5">
                Formula: (Total Demand + Total Time + ODTL) - Interbank Exemptions
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 font-sans">
              <div className="font-bold text-slate-300">Central Bank Statutory Rule:</div>
              <div>{ndtl.centralBankCircularReference}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CRR MONITORING */}
      {activeTab === 'CRR' && crr && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-400" />
              Cash Reserve Ratio (CRR) Monitoring Console — Section 42(1) RBI Act
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Scheduled commercial banks are mandated to maintain minimum average cash balances with the Reserve Bank of India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Prescribed CRR Rate</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">{crr.prescribedCrrRate}%</div>
              <p className="text-[11px] text-slate-400">Configured via official RBI monetary circular.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Required Reserve Amount</span>
              <div className="text-2xl font-bold font-mono text-white">
                ₹{(crr.requiredCrrAmount / 10000000).toFixed(2)} Cr
              </div>
              <p className="text-[11px] text-slate-400">
                Minimum Daily (90%): ₹{(crr.minimumDailyRequiredAmount / 10000000).toFixed(2)} Cr
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Actual RBI Reserve Balance</span>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                ₹{(crr.actualBalanceWithRbi / 10000000).toFixed(2)} Cr
              </div>
              <p className="text-[11px] text-slate-400">
                Maintained in General Ledger <code className="text-emerald-400">1040-RBI-RESERVE-BALANCE</code>
              </p>
            </div>
          </div>

          {/* Statutory Surplus/Deficit Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              crr.compliant
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                {crr.compliant ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-rose-400" />}
                <span className="font-bold text-sm">
                  {crr.compliant ? 'CRR Statutory Requirement Fully Satisfied' : 'CRR Statutory Reserve Deficit Alert'}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90">{crr.notes}</p>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs uppercase font-bold">Surplus Reserve Cushion:</span>
              <div className="text-2xl font-bold">
                +₹{(crr.surplusDeficitAmount / 10000000).toFixed(2)} Cr
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SLR MONITORING */}
      {activeTab === 'SLR' && slr && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-400" />
              Statutory Liquidity Ratio (SLR) Monitoring — Section 24 BR Act, 1949
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Maintenance of unencumbered liquid assets to protect public depositors and ensure systemic liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-sans">Central Govt G-Secs:</span>
              <div className="text-xl font-bold text-white">
                ₹{(slr.centralGovtSecuritiesValue / 10000000).toFixed(2)} Cr
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-sans">State Development Loans:</span>
              <div className="text-xl font-bold text-white">
                ₹{(slr.stateDevLoansValue / 10000000).toFixed(2)} Cr
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-sans">Treasury Bills (91/182/364D):</span>
              <div className="text-xl font-bold text-white">
                ₹{(slr.treasuryBillsValue / 10000000).toFixed(2)} Cr
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-sans">Physical Vault Cash & Excess CRR:</span>
              <div className="text-xl font-bold text-emerald-400">
                ₹{((slr.physicalVaultCashValue + slr.excessCrrBalanceWithRbi) / 10000000).toFixed(2)} Cr
              </div>
            </div>
          </div>

          {/* SLR Ratio Summary Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold font-sans">
                Total Qualifying Unencumbered Liquid Assets
              </span>
              <div className="text-3xl font-extrabold text-emerald-300 mt-1">
                ₹{(slr.totalEligibleLiquidAssets / 10000000).toFixed(2)} Cr
              </div>
              <div className="text-xs text-slate-400 font-sans mt-0.5">
                Required ({slr.prescribedSlrRate}% of NDTL): ₹{(slr.requiredSlrAmount / 10000000).toFixed(2)} Cr
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs uppercase font-bold text-slate-400 font-sans">Actual Maintenance Ratio:</span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {slr.actualSlrMaintenancePct?.toFixed(2)}%
              </div>
              <span className="text-xs text-emerald-300 font-sans font-bold">
                Buffer Surplus: +₹{(slr.surplusDeficitAmount / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ELIGIBLE LIQUID ASSETS TABLE */}
      {activeTab === 'ASSETS' && data?.liquidAssets && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Statutory Liquid Asset Holdings Portfolio (SLR Pool)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified sovereign debt instruments deposited in RBI Subsidiary General Ledger (SGL) accounts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] bg-slate-950/40 font-mono">
                  <th className="py-3 px-4">ISIN / Identifier</th>
                  <th className="py-3 px-4">Asset Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Face Value</th>
                  <th className="py-3 px-4">Market Value</th>
                  <th className="py-3 px-4">Coupon</th>
                  <th className="py-3 px-4">Maturity</th>
                  <th className="py-3 px-4">Depository</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.liquidAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3 px-4 font-bold text-emerald-400">{asset.assetIdentifier}</td>
                    <td className="py-3 px-4 font-sans text-white font-medium">{asset.assetName}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{asset.assetType}</td>
                    <td className="py-3 px-4 text-slate-400">₹{(asset.faceValue / 10000000).toFixed(2)} Cr</td>
                    <td className="py-3 px-4 font-bold text-white">₹{(asset.marketValue / 10000000).toFixed(2)} Cr</td>
                    <td className="py-3 px-4 text-emerald-300">{asset.couponRate}%</td>
                    <td className="py-3 px-4 text-slate-400">{asset.maturityDate || 'N/A'}</td>
                    <td className="py-3 px-4 font-sans text-slate-400">{asset.custodyDepository}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CONFIGURABLE REGULATORY RATES */}
      {activeTab === 'CONFIG' && data?.regulatoryConfigs && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-400" />
                Configurable Regulatory Rate Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic statutory parameters, effective dates, and official RBI circular source references.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.regulatoryConfigs.map((cfg) => (
              <div key={cfg.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{cfg.parameterName}</div>
                  <span className="text-xl font-mono font-bold text-emerald-400">
                    {cfg.parameterValue}
                    {cfg.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cfg.description}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 font-semibold">Effective: </span>
                    {cfg.effectiveDate}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedConfig(cfg);
                      setNewConfigValue(cfg.parameterValue);
                      setNewConfigDate(cfg.effectiveDate);
                      setNewConfigRef(cfg.sourceCircularReference || '');
                      setShowConfigModal(true);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    Modify Rate
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Source: {cfg.sourceCircularReference}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: STRESS SIMULATION SANDBOX */}
      {activeTab === 'STRESS' && (
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-400" />
              Regulatory Liquidity & Stress Testing Simulation Console
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate macroeconomic stress scenarios, hypothetical deposit runoff runs, or regulatory rate hikes to forecast capital and reserve impacts.
            </p>
          </div>

          <form onSubmit={handleSimulate} className="space-y-5 max-w-xl text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Hypothetical Deposit Outflow Drain Scenario (% of Deposits)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={stressDepositDrain}
                onChange={(e) => setStressDepositDrain(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500">
                Simulates an instantaneous withdrawal run of {stressDepositDrain}% across retail and commercial deposits.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Simulated CRR Rate (%)</label>
                <input
                  type="number"
                  step="0.25"
                  value={simCrrRate}
                  onChange={(e) => setSimCrrRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Simulated SLR Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simSlrRate}
                  onChange={(e) => setSimSlrRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Scenario Description & Objective</label>
              <input
                type="text"
                value={simNotes}
                onChange={(e) => setSimNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 font-bold text-white shadow-lg transition disabled:opacity-50"
            >
              {isSimulating ? 'Computing Stress Scenario Impact...' : 'Execute Stress Simulation'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Config Modal */}
      {showConfigModal && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-emerald-950/60 px-6 py-4 flex items-center justify-between border-b border-emerald-900/60">
              <h3 className="font-bold text-white text-base">Update Regulatory Rate Parameter</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateConfig} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Parameter Key</label>
                <input
                  type="text"
                  disabled
                  value={selectedConfig.parameterKey}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Statutory Value (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newConfigValue}
                  onChange={(e) => setNewConfigValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={newConfigDate}
                  onChange={(e) => setNewConfigDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">RBI Statutory Circular Reference</label>
                <input
                  type="text"
                  required
                  value={newConfigRef}
                  onChange={(e) => setNewConfigRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  placeholder="e.g. RBI/2026-27/14 DOR.RET.REC.22"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition"
                >
                  Save Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
