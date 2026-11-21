import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Landmark, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  Download,
  Building,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  Lock,
  Database,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InterviewGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewGuideModal: React.FC<InterviewGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'credentials' | 'architecture'>('workflow');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadWorkflowPdf = () => {
    const originalTitle = document.title;
    document.title = 'Apex_National_Bank_Enterprise_CBS_Interview_and_Testing_Guide';
    window.print();
    document.title = originalTitle;
  };

  const workflowSteps = [
    {
      step: 1,
      title: 'Head Office Command & Multi-Branch Balance Sheet Consolidation',
      route: '/dashboard',
      icon: Building,
      badge: 'Step 1: Central Treasury Oversight',
      color: 'emerald',
      whatToSay: 'The system aggregates live deposits (₹1,845 Cr) and advances (₹1,210 Cr) across all national branch networks. In-memory volatile TTL caching reduces dashboard latency from 7.6s down to sub-millisecond speeds (< 1ms).',
      quickAction: 'Open Dashboard -> Observe the 4 primary KPI cards, live CRR/SLR compliance indicators, and click "Sync Data" to see live ledger re-synchronization.'
    },
    {
      step: 2,
      title: 'Branch Network Governance & Vault Cash Threshold Sweeps',
      route: '/branches',
      icon: Landmark,
      badge: 'Step 2: Liquidity Management',
      color: 'blue',
      whatToSay: 'Each branch maintains its own cash vault with dynamic ceilings (e.g. ₹50,00,000). If a branch exceeds its threshold, the system flags a vault sweep notification to route excess liquidity to the Head Office or RBI currency chest.',
      quickAction: 'Open Branch Management -> Review zonal branches (Bangalore, Mumbai, Delhi, Hyderabad) and inspect individual cash vault balances.'
    },
    {
      step: 3,
      title: 'Electronic Payment Rail Switch (RTGS / NEFT / IMPS) & Dual-Control Clearance',
      route: '/transfers',
      icon: CreditCard,
      badge: 'Step 3: Four-Eyes Maker-Checker',
      color: 'indigo',
      whatToSay: 'High-value transactions (> ₹5,00,000) automatically trigger a Maker-Checker workflow under strict RBI SLA timers. The Maker initiates the transfer, generating a synthetic 16-character UTR, while a Checker must independently verify and authorize it.',
      quickAction: 'Go to Fund Transfers -> Execute a transfer -> If high-value, navigate to Maker-Checker Queue (/approvals) to approve it.'
    },
    {
      step: 4,
      title: 'Commercial & Retail Loan Underwriting with Pure BigDecimal Amortization',
      route: '/loans',
      icon: TrendingUp,
      badge: 'Step 4: Credit Facility & IRAC Provisioning',
      color: 'teal',
      whatToSay: 'Loans are processed with multi-stage approval (DRAFT -> UNDERWRITING -> SANCTIONED -> DISBURSED). Interest and EMI schedules are computed using pure Java BigDecimal with HALF_EVEN rounding to eliminate fractional rounding drift.',
      quickAction: 'Open Loan Desk -> Review the active loan portfolio, check NPA asset classifications (STANDARD vs SUB-STANDARD), and generate loan amortization statements.'
    },
    {
      step: 5,
      title: 'Central Reserve Supervisory Matrix (Section 42 CRR & Section 24 SLR)',
      route: '/regulatory',
      icon: ShieldCheck,
      badge: 'Step 5: RBI Statutory Liquidity Engine',
      color: 'green',
      whatToSay: 'Calculates dynamic Net Demand and Time Liabilities (NDTL) under RBI Form-A guidelines. Monitors Cash Reserve Ratio (4.50%) maintained with RBI in RTGS accounts and Statutory Liquidity Ratio (18.00%) invested in sovereign benchmark G-Secs and T-Bills.',
      quickAction: 'Open Regulatory & Liquidity Hub -> Run the Stress Simulation Sandbox (e.g. 5% deposit outflow) to observe dynamic reserve ratio resilience.'
    },
    {
      step: 6,
      title: 'Automated 5-Point End-of-Day (EOD) / SOD Batch Closing Orchestrator',
      route: '/dashboard',
      icon: Clock,
      badge: 'Step 6: General Ledger Settlement',
      color: 'amber',
      whatToSay: 'The core batch orchestrator sequentially verifies the 5 mandatory closing proofs: (1) Branch teller cash drawer tally, (2) Double-entry trial balance proof (Sum Debits = Sum Credits), (3) Overnight interest accruals, (4) Statutory CRR/SLR compliance verification, and (5) Financial period locking.',
      quickAction: 'On Dashboard, switch to "EOD / SOD Batch Closing Orchestrator" tab -> Click "Execute Full EOD Closing" and watch each step verify live.'
    }
  ];

  const credentials = [
    {
      role: 'Head Office Super Admin',
      username: 'ho_admin',
      password: 'Password@123',
      description: 'Full supervisory authority across all branches, EOD batch closing, regulatory sign-offs, and general ledger configuration.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      role: 'Branch Manager (Bangalore)',
      username: 'bm_bangalore',
      password: 'Password@123',
      description: 'Branch oversight, teller till supervision, high-value transfer authorization, and commercial loan sanctions.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      role: 'Branch Operations Officer / Teller',
      username: 'emp_bangalore',
      password: 'Password@123',
      description: 'Counter cash deposits, physical note denomination verification, withdrawals, and account opening.',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    },
    {
      role: 'Retail Wealth Client',
      username: 'cust_rahul',
      password: 'Password@123',
      description: 'Customer portal access for balance inquiries, electronic RTGS/NEFT transfers, and term deposit creation.',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-[#06231D] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Enterprise CBS Operations & Architecture Guide
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  CORE BANKING
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Step-by-step core banking operations walkthrough, what to say to the interviewer, and pre-verified test credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadWorkflowPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all"
              title="Print or Save PDF of this Guide"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Print Guide</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'workflow'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Workflow Walkthrough (6 Steps)</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Verified Credentials (1-Click Copy)</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'architecture'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>System Architecture & Engineering Highlights</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          
          {/* TAB 1: WORKFLOW STEPS */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed">
                  <strong>How to use this during your interview:</strong> Follow Steps 1 through 6 in sequence. Each step tells you the exact page to open, what action to perform, and the precise architectural explanation to give the interviewer.
                </div>
              </div>

              <div className="space-y-4">
                {workflowSteps.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:border-emerald-400 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-sm">
                            {s.step}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                              {s.badge}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {s.title}
                            </h4>
                          </div>
                        </div>

                        <Link
                          to={s.route}
                          onClick={onClose}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors w-fit"
                        >
                          <span>Open Module</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            💬 What to Say to the Interviewer:
                          </span>
                          <p className="text-slate-800 leading-relaxed italic">
                            "{s.whatToSay}"
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                            ⚡ Quick Live Demo Action:
                          </span>
                          <p className="text-emerald-950 font-medium leading-relaxed">
                            {s.quickAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed">
                  All institutional personas are pre-seeded in the cloud database. Click any <strong>Copy</strong> button to immediately copy the username and password to your clipboard.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map((c) => (
                  <div key={c.username} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                          {c.role}
                        </span>
                        <span className="text-[10px] text-slate-400">Verified</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500">Username: <strong className="text-slate-900 font-mono">{c.username}</strong></span>
                        <button
                          onClick={() => copyToClipboard(c.username)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          {copiedText === c.username ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === c.username ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500">Password: <strong className="text-slate-900 font-mono">{c.password}</strong></span>
                        <button
                          onClick={() => copyToClipboard(c.password)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          {copiedText === c.password ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedText === c.password ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Double-Entry General Ledger
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Every transaction enforces immutable double-entry journal postings (Total DR = Total CR) across Asset, Liability, Income, and Expense accounts.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Four-Eyes Maker-Checker
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    High-value advances and payment orders require independent approval by an authorized officer, complete with SLA timeout sweeps and escalation.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-3">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Pure BigDecimal Precision
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Zero floating-point arithmetic errors. All interest accruals, amortization schedules, and CRR/SLR ratios use Java BigDecimal with HALF_EVEN rounding.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Technical Stack Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Backend</span>
                    <strong className="text-slate-900">Spring Boot 3.3.4 (Java 17)</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Frontend</span>
                    <strong className="text-slate-900">React 18 + Vite + Tailwind</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Database</span>
                    <strong className="text-slate-900">TiDB Cloud Serverless (MySQL)</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Security</span>
                    <strong className="text-slate-900">JWT + RBAC + Audit Logging</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Apex National Bank Core CBS v4.8 • Enterprise Testing & Demonstration Mode
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
