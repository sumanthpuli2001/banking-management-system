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
  Cpu,
  Building,
  Briefcase,
  Users,
  ShieldAlert
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Pre-load default verified credentials for Head Office Admin
  const [username, setUsername] = useState('ho_admin');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendReady, setBackendReady] = useState<boolean>(false);

  // Pre-warm backend connection immediately on mount
  useEffect(() => {
    let isMounted = true;
    const warmUp = async () => {
      try {
        await api.get('/auth/health', { timeout: 3500 });
        if (isMounted) setBackendReady(true);
      } catch {
        try {
          await api.get('/auth/me', { timeout: 4000 });
        } catch {
          // container waking up
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
      const res = await api.post<ApiResponse<LoginResponseData>>(
        '/auth/login',
        {
          username: username.trim(),
          password: password.trim(),
        },
        { timeout: 25000 }
      );

      if (res.data?.success && res.data.data) {
        login(res.data.data);
        navigate('/dashboard');
      } else {
        setError(res.data?.message || 'Institutional verification failed. Check credentials.');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Cloud banking backend is waking from power-save mode. Please click Access Secure Portal once more.');
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to reach core institutional banking node. Please verify credentials or retry.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDefaultCredentials = () => {
    setUsername('ho_admin');
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden font-sans bg-[#041a15]">
      {/* Luxurious Bank Architectural Background with High-Contrast Darkening */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
        style={{ 
          backgroundImage: `url('/assets/luxury-bank-bg.jpg')`,
          filter: 'brightness(0.28) contrast(1.15) saturate(0.85)'
        }}
      />

      {/* Solid Swiss Emerald & Obsidian Dark Vignette Overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 35, 29, 0.88) 0%, rgba(3, 20, 16, 0.96) 80%, rgba(1, 10, 8, 0.99) 100%)'
        }}
      />

      {/* Subtle Mint/Emerald Ambient Glow */}
      <div className="absolute w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none top-1/2 left-1/4 -translate-y-1/2" />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Bank Institutional Grandeur & Security Credentials inside Protected Glassmorphic Card */}
        <div className="lg:col-span-7 bg-[#06231D]/88 border border-emerald-500/35 rounded-3xl p-7 sm:p-9 backdrop-blur-xl shadow-2xl text-white space-y-6">
          
          {/* Bank Crest & Brand Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/25 via-slate-950 to-black p-2 border border-emerald-400/50 shadow-2xl flex items-center justify-center backdrop-blur-md shrink-0">
              <BankLogo size={46} className="filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
                  Est. 1928 • Scheduled Commercial Bank • Tier-1 Core CBS
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                Apex National Bank
              </h1>
              <p className="text-xs tracking-normal text-emerald-200/90 font-medium mt-0.5">
                Central Head Office & Institutional Banking Group
              </p>
            </div>
          </div>

          {/* Core Regulatory Certification Card */}
          <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold tracking-wide mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="uppercase">Central Monetary & Statutory Banking Protocols</span>
            </div>
            
            <p className="text-xs text-slate-100 leading-relaxed font-normal">
              Apex National Bank Core Terminal governs multi-branch liquidity clearance, real-time RTGS/NEFT settlement corridors, immutable double-entry general ledgers, and maker-checker capital authorization across all national zones.
            </p>

            <div className="mt-4 pt-4 border-t border-emerald-900/80 grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/50 rounded-xl p-2.5 border border-emerald-800/60 shadow-inner">
                <div className="text-base font-extrabold text-emerald-300">24.8%</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-tight font-mono">Capital Adequacy</div>
              </div>
              <div className="bg-black/50 rounded-xl p-2.5 border border-emerald-800/60 shadow-inner">
                <div className="text-base font-extrabold text-emerald-400">100%</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-tight font-mono">Basel III Solvency</div>
              </div>
              <div className="bg-black/50 rounded-xl p-2.5 border border-emerald-800/60 shadow-inner">
                <div className="text-base font-extrabold text-emerald-300">256-Bit</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-tight font-mono">HSM Encryption</div>
              </div>
            </div>
          </div>

          {/* Institutional Trust Badges */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center space-x-3 text-xs text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-medium">Centralized Head Office oversight across Southern, Western & Northern zonal commands</span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="font-medium">Dual-authorization segregation of duties for high-value advances & vault operations</span>
            </div>
          </div>

          {/* Connection Speed Status */}
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-emerald-900/60">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Core Gateway:</span>
            <span className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>{backendReady ? 'Live & Synchronized (0ms latency)' : 'Connecting to Core Cloud Cluster...'}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Security Authentication Terminal */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-emerald-200/80 p-8 sm:p-10 relative">
          
          {/* Top Emerald Accent Bar */}
          <div className="absolute top-0 left-8 right-8 h-1.5 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700 rounded-b" />

          <div className="pb-4 mb-5 border-b border-slate-100">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700">
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
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{error}</span>
                <button
                  type="button"
                  onClick={resetDefaultCredentials}
                  className="block mt-1 text-[11px] text-rose-900 underline font-bold"
                >
                  Reset to Default Verified Admin Credentials
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Username / Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono transition bg-slate-50 shadow-inner font-medium"
                  placeholder="e.g. ho_admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono transition bg-slate-50 shadow-inner font-medium"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center space-x-2.5 shadow-xl hover:shadow-emerald-700/20 border border-emerald-900 disabled:opacity-60 transform active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-emerald-200 border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING WITH CORE...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-wider">ACCESS SECURE PORTAL</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Apex HSM Hardware Security Module Protected • Double-Entry Audit Logged</span>
          </div>
        </div>

      </div>
    </div>
  );
};
