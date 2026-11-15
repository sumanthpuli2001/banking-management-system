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
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-amber-200/50 text-slate-800 flex items-center justify-between px-6 select-none sticky top-0 z-30 shadow-sm">
      {/* Left: Bank Identity & System State */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-md p-1 border border-amber-300">
            <BankLogo size={32} className="filter drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-base uppercase text-slate-900 font-sans">
                Apex National Bank
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-200">
                CORE v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-tight font-medium">
              Central Head Office & Multi-Branch Banking Terminal
            </p>
          </div>
        </div>

        {/* Financial Regulatory Status Pill */}
        <div className="hidden xl:flex items-center space-x-2 text-xs bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-200/60 font-mono text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 font-semibold tracking-tight">CRR/SLR COMPLIANT</span>
          <span className="text-amber-300">•</span>
          <Clock className="w-3.5 h-3.5 text-amber-700" />
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
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* Right: Branch Info, Quick Stats & Executive Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Branch Context Card */}
        <div className="hidden sm:flex flex-col text-right pr-2 border-r border-slate-200">
          <span className="text-xs font-bold text-slate-800 flex items-center justify-end space-x-1.5">
            <Landmark className="w-3.5 h-3.5 text-amber-600" />
            <span>{user?.branchName || 'Apex Central Head Office'}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            BRANCH: {user?.branchCode || 'HO-001'} {user?.isHeadOffice && '• [CENTRAL HO]'}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-600 hover:text-amber-900 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {/* Executive Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-900 to-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.fullName || 'Institutional Officer'}
              </div>
              <div className="text-[10px] text-amber-700 font-mono font-medium">
                {user?.roles?.[0] || 'SUPER_ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-amber-200/60 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200"
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
