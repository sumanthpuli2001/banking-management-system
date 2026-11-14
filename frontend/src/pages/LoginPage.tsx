import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ApiResponse, LoginResponseData } from '../types/auth';
import { Building2, ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('ho_admin');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoRoles = [
    { label: 'SUPER ADMIN', user: 'superadmin', role: 'System Architect', color: 'border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900' },
    { label: 'HEAD OFFICE ADMIN', user: 'ho_admin', role: 'SVP Operations', color: 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900' },
    { label: 'REGIONAL MGR', user: 'rm_south', role: 'GM South Zone', color: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900' },
    { label: 'BRANCH MGR', user: 'bm_bangalore', role: 'MG Road Branch', color: 'border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-900' },
    { label: 'BANK EMPLOYEE', user: 'emp_bangalore', role: 'Customer Service', color: 'border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900' },
    { label: 'CASHIER', user: 'cashier_blr', role: 'Teller Counter #1', color: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900' },
    { label: 'LOAN OFFICER', user: 'loan_officer_blr', role: 'Lending Desk', color: 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900' },
    { label: 'AUDITOR', user: 'chief_auditor', role: 'Compliance Insp.', color: 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900' },
    { label: 'CUSTOMER', user: 'cust_rahul', role: 'Retail Client', color: 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900' },
  ];

  const handleDemoSelect = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('Password@123');
    setError(null);
  };

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
        setError(res.data.message || 'Authentication rejected by core security server');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to connect to Apex Banking Authentication service. Verify core is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bank-950 via-bank-900 to-slatebank-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Architectural Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#142C4E15_1px,transparent_1px),linear-gradient(to_bottom,#142C4E15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Institutional Welcome & Credential Selector */}
        <div className="md:col-span-6 text-white space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-bank-600 via-bank-500 to-bank-300 flex items-center justify-center shadow-xl border border-bank-400/40">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-bank-100 to-bank-300">
                Apex National Bank
              </h1>
              <p className="text-xs font-mono text-bank-300 tracking-tight">
                CORE BANKING ARCHITECTURE • HEAD OFFICE PLATFORM
              </p>
            </div>
          </div>

          <div className="bg-bank-900/80 border border-bank-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>REGULATORY COMPLIANT BANKING GATEWAY</span>
            </div>
            <p className="text-xs text-slatebank-300 leading-relaxed">
              Centralized Head Office oversight, multi-branch liquidity supervision, role-segregated transaction ledgers, and maker-checker approval workflows.
            </p>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slatebank-300">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-bank-300">
                Quick Role Credentials (Development Demo)
              </span>
              <span className="text-[10px] font-mono text-slatebank-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demoRoles.map((dr) => (
                <button
                  key={dr.user}
                  type="button"
                  onClick={() => handleDemoSelect(dr.user)}
                  className={`p-2 rounded-lg border text-left transition transform active:scale-95 text-xs ${dr.color} ${
                    username === dr.user ? 'ring-2 ring-white font-bold' : ''
                  }`}
                >
                  <div className="font-extrabold text-[10px] tracking-tight">{dr.label}</div>
                  <div className="text-[10px] opacity-80 truncate">{dr.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Security Login Form */}
        <div className="md:col-span-6 bg-white rounded-2xl shadow-2xl border border-slatebank-200 p-8">
          <div className="border-b border-slatebank-200 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slatebank-900 tracking-tight">
              Institutional User Sign In
            </h2>
            <p className="text-xs text-slatebank-500 mt-0.5">
              Enter official employee or customer banking credentials
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slatebank-700 uppercase tracking-wider mb-1.5">
                Username / Institutional ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slatebank-300 text-sm text-slatebank-900 focus:outline-none focus:border-bank-500 focus:ring-1 focus:ring-bank-500 font-mono"
                  placeholder="e.g. ho_admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slatebank-700 uppercase tracking-wider mb-1.5">
                Institutional Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slatebank-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slatebank-300 text-sm text-slatebank-900 focus:outline-none focus:border-bank-500 focus:ring-1 focus:ring-bank-500 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
              <p className="text-[10px] text-slatebank-400 mt-1 font-mono">
                Default password for all demo accounts: <strong className="text-slatebank-700">Password@123</strong>
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-bank-900 hover:bg-bank-800 text-white font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <span>AUTHENTICATING WITH CORE...</span>
                ) : (
                  <>
                    <span>ACCESS SECURE PORTAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slatebank-100 text-[10px] text-slatebank-400 text-center leading-relaxed">
            By accessing this financial terminal, you agree to comply with Apex Banking Security Regulations. Unauthorized access is prohibited by law.
          </div>
        </div>
      </div>
    </div>
  );
};
