import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  Search, 
  LogOut, 
  User, 
  ChevronDown, 
  Clock, 
  Globe2 
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
    <header className="h-16 bg-bank-950 border-b border-bank-800 text-white flex items-center justify-between px-6 select-none sticky top-0 z-30 shadow-md">
      {/* Left: Bank Identity & System State */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-bank-700 via-bank-500 to-bank-400 flex items-center justify-center shadow-lg border border-bank-400/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-base uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-bank-100 to-bank-200">
                Apex National Bank
              </span>
              <span className="text-[10px] bg-bank-800/80 text-bank-300 font-mono px-1.5 py-0.5 rounded border border-bank-700">
                BMS v2.4
              </span>
            </div>
            <p className="text-[11px] text-slatebank-400 tracking-tight font-medium">
              Enterprise Head Office & Branch Operations Core
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs bg-bank-900/90 px-3 py-1.5 rounded-md border border-bank-800 font-mono text-slatebank-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-semibold tracking-wide">SECURE CORE</span>
          <span className="text-bank-700">|</span>
          <Clock className="w-3.5 h-3.5 text-slatebank-400" />
          <span className="text-slatebank-200">{currentTime || 'Synchronizing...'}</span>
        </div>
      </div>

      {/* Middle: Institutional Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slatebank-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts, customers, IFSC, transactions..."
            className="w-full bg-bank-900/80 border border-bank-800 text-xs text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-bank-500 focus:ring-1 focus:ring-bank-500 transition placeholder:text-slatebank-500"
          />
        </div>
      </div>

      {/* Right: Branch Info, Notifications & Profile */}
      <div className="flex items-center space-x-4">
        {/* Branch Context Pill */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-white flex items-center justify-end space-x-1.5">
            <Globe2 className="w-3.5 h-3.5 text-bank-400" />
            <span>{user?.branchName || 'Apex Central Head Office'}</span>
          </span>
          <span className="text-[10px] font-mono text-bank-300">
            CODE: {user?.branchCode || 'HO-001'} {user?.isHeadOffice && '• [HEAD OFFICE]'}
          </span>
        </div>

        <div className="h-6 w-px bg-bank-800 hidden sm:block" />

        {/* Notifications */}
        <button 
          title="Institutional Notifications & Approvals"
          className="relative p-2 rounded-lg text-slatebank-300 hover:text-white hover:bg-bank-900 border border-transparent hover:border-bank-800 transition"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-bank-900 border border-transparent hover:border-bank-800 transition"
          >
            <div className="w-8 h-8 rounded-md bg-bank-800 border border-bank-700 flex items-center justify-center font-bold text-xs text-bank-200">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AN'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.fullName || 'Institutional User'}
              </span>
              <span className="text-[10px] text-bank-300 font-mono leading-tight">
                {user?.roles?.[0] || 'PERSONNEL'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slatebank-400" />
          </button>

          {profileOpen && (
            <div 
              onMouseLeave={() => setProfileOpen(false)}
              className="absolute right-0 mt-2 w-64 bg-slatebank-900 border border-bank-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
            >
              <div className="px-4 py-3 border-b border-bank-800">
                <p className="text-xs text-slatebank-400">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-bank-400 font-mono truncate">{user?.email}</p>
                <div className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-bank-800 text-bank-200 border border-bank-700">
                  Role: {user?.roles?.[0]}
                </div>
              </div>

              <div className="px-2 py-1">
                <button 
                  onClick={() => setProfileOpen(false)}
                  className="w-full text-left px-3 py-2 text-xs text-slatebank-200 hover:bg-bank-800/80 rounded-md flex items-center space-x-2"
                >
                  <User className="w-4 h-4 text-slatebank-400" />
                  <span>Profile & Security Credentials</span>
                </button>
              </div>

              <div className="border-t border-bank-800 px-2 pt-1 mt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-md flex items-center space-x-2 transition font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Terminate Banking Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
