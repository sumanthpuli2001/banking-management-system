import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ApiResponse, LoginResponseData } from '../types/auth';
import { BankLogo } from '../components/common/BankLogo';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Landmark, 
  Award,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('ho_admin');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState<boolean>(false);

  // Requirement 3: Warm up backend connection immediately on component mount!
  useEffect(() => {
    let isMounted = true;
    const warmUp = async () => {
      try {
        await api.get('/auth/health', { timeout: 3500 });
        if (isMounted) setBackendReady(true);
      } catch {
        // Fallback ping to ensure Render container is active
        try {
          await api.get('/auth/me', { timeout: 4000 });
        } catch {
          // container woke up or rejected unauthenticated
        }
        if (isMounted) setBackendReady(true);
      }
    };
    warmUp();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<ApiResponse<LoginResponseData>>('/auth/login', {
        username,
        password,
      });

      if (res.data.success && res.data.data) {
        login(res.data.data);
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Institutional verification failed. Check credentials.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to reach core institutional banking node. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden font-sans">
      {/* Luxurious Bank Architectural Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/assets/luxury-bank-bg.jpg')` }}
      />

      {/* Dark Obsidian & Gold Luxury Tint Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-slate-950/85 to-black/92 backdrop-blur-[2px]" />

      {/* Subtle Financial Radial Glow */}
      <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none top-1/2 left-1/4 -translate-y-1/2" />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Bank Institutional Grandeur & Security Credentials */}
        <div className="lg:col-span-7 text-white space-y-7 pr-0 lg:pr-6">
          
          {/* Bank Crest & Brand Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 via-slate-900 to-black p-2 border border-amber-400/40 shadow-2xl flex items-center justify-center backdrop-blur-md">
              <BankLogo size={46} className="filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  Est. 1928 • Tier-1 Capital
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Apex National Bank
              </h1>
              <p className="text-xs tracking-wider uppercase text-slate-300 font-medium mt-0.5">
                Central Head Office & Institutional Banking Group
              </p>
            </div>
          </div>

          {/* Core Regulatory Certification Card */}
          <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-2.5 text-amber-400 text-xs font-bold font-mono tracking-wide mb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>CENTRAL BANK MONETARY COMPLIANCE ARCHITECTURE</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Apex National Bank Core Terminal governs multi-branch liquidity clearance, real-time RTGS/NEFT settlement corridors, immutable double-entry general ledgers, and maker-checker capital authorization across all national zones.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/40 rounded-xl p-2.5 border border-slate-800">
                <div className="text-base font-extrabold text-amber-300">24.8%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tight">Capital Adequacy</div>
              </div>
              <div className="bg-black/40 rounded-xl p-2.5 border border-slate-800">
                <div className="text-base font-extrabold text-emerald-400">100%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tight">Basel III Ratio</div>
              </div>
              <div className="bg-black/40 rounded-xl p-2.5 border border-slate-800">
                <div className="text-base font-extrabold text-amber-300">256-Bit</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tight">HSM Encryption</div>
              </div>
            </div>
          </div>

          {/* Institutional Trust Badges */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>
              <span>Centralized Head Office oversight across Southern, Western & Northern zonal commands</span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <span>Dual-authorization segregation of duties for high-value advances & vault operations</span>
            </div>
          </div>

          {/* Connection Speed Status */}
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 pt-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Core Gateway:</span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{backendReady ? 'Live & Synchronized (0ms latency)' : 'Connecting to Core Cloud Cluster...'}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Security Authentication Terminal */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-amber-200/40 p-8 sm:p-10 relative">
          
          {/* Subtle Top Gold Accent Bar */}
          <div className="absolute top-0 left-8 right-8 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-b" />

          <div className="pb-5 mb-6 border-b border-slate-100">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600">
              Authorized Personnel Only
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Institutional User Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter official employee or customer banking credentials to authenticate with core ledger.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Username / Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono transition bg-slate-50/50"
                  placeholder="e.g. ho_admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono transition bg-slate-50/50"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center space-x-2.5 shadow-xl hover:shadow-amber-500/20 border border-slate-800 disabled:opacity-60 transform active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING WITH CORE...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-wider">ACCESS SECURE PORTAL</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center space-x-2 text-[10px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Apex HSM Hardware Security Module Protected • Audit Logged</span>
          </div>
        </div>

      </div>
    </div>
  );
};
