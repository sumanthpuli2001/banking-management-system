import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BankLogo } from './BankLogo';
import { 
  Bell, 
  Search, 
  LogOut, 
  User, 
  ChevronDown, 
  Clock, 
  Landmark,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }) +
          ' IST'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-emerald-200/60 text-slate-800 flex items-center justify-between px-6 select-none sticky top-0 z-30 shadow-xs">
      {/* Left: Bank Identity & System State */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#06231D] flex items-center justify-center shadow-md p-1 border border-emerald-400/40">
            <BankLogo size={32} className="filter drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-base uppercase text-slate-900 font-sans">
                Apex National Bank
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                SWISS TIER v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-tight font-medium">
              Central Head Office & Private Wealth Management Console
            </p>
          </div>
        </div>

        {/* Financial Regulatory Status Pill */}
        <div className="hidden xl:flex items-center space-x-2 text-xs bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200 font-mono text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-800 font-bold tracking-tight">CRR/SLR: 24.8% COMPLIANT</span>
          <span className="text-emerald-300">•</span>
          <Clock className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-slate-800 font-medium">{currentTime || 'Synchronizing...'}</span>
        </div>
      </div>

      {/* Middle: Universal Banking Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts, customers, IFSC codes, transactions..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* Right: Branch Info, Quick Stats & Executive Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Branch Context Card */}
        <div className="hidden sm:flex flex-col text-right pr-2 border-r border-slate-200">
          <span className="text-xs font-bold text-slate-800 flex items-center justify-end space-x-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-700" />
            <span>{user?.branchName || 'Apex Central Head Office'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            BRANCH: {user?.branchCode || 'HO-001'} {user?.isHeadOffice && '• [CENTRAL HO]'}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Executive Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-900 to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName || 'Institutional Officer'}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono font-medium">
                {user?.roles?.[0] || 'SUPER_ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminate Institutional Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
