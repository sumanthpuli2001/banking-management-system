import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Layers,
  X
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'APPROVAL' | 'AML' | 'EOD' | 'CASH' | 'REGULATORY';
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  description: string;
  timestamp: string;
  link: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'APPROVAL',
    severity: 'HIGH',
    title: 'Dual-Control SLA Alert',
    description: 'Payment authorization #REQ-101 (₹7,50,000 RTGS) approaching 30-min SLA threshold.',
    timestamp: 'Just now',
    link: '/approvals',
    isRead: false,
  },
  {
    id: 'notif-2',
    type: 'AML',
    severity: 'HIGH',
    title: 'Suspicious Structuring Trigger',
    description: 'AML-20261115-5132: 3 cash deposits under ₹10L detected on CIF-100234.',
    timestamp: '12 min ago',
    link: '/compliance',
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'EOD',
    severity: 'INFO',
    title: 'Batch Settlement Status',
    description: 'Inter-branch RTGS clearing cycle #14 completed with 0.00 ledger variance.',
    timestamp: '35 min ago',
    link: '/dashboard',
    isRead: false,
  },
  {
    id: 'notif-4',
    type: 'CASH',
    severity: 'MEDIUM',
    title: 'Vault Cash Threshold Notice',
    description: 'HO-001 vault holding exceeds ₹50,00,000 ceiling. Auto-transit sweep available.',
    timestamp: '1 hr ago',
    link: '/branch-cash',
    isRead: true,
  },
  {
    id: 'notif-5',
    type: 'REGULATORY',
    severity: 'INFO',
    title: 'CRR/SLR Reserve Verified',
    description: 'Active Fortnight FN-2026-22 composite reserve at 24.8% (fully compliant).',
    timestamp: '2 hr ago',
    link: '/regulatory',
    isRead: true,
  },
];

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setNotificationOpen(false);
    navigate(item.link);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'URGENT') return n.severity === 'HIGH';
    return true;
  });

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-emerald-200/60 text-slate-800 flex items-center justify-between px-6 select-none sticky top-0 z-30 shadow-xs">
      {/* Left: Bank Identity & System State */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#06231D] flex items-center justify-center shadow-md p-1 border border-emerald-400/40 shrink-0">
            <BankLogo size={32} className="filter drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-base text-slate-900 font-sans">
                Apex National Bank
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-900 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">
                SCHEDULED COMMERCIAL BANK • RBI REGULATED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-normal font-medium">
              Central Head Office & Institutional Banking Console
            </p>
          </div>
        </div>

        {/* Financial Regulatory Status Pill */}
        <div className="hidden xl:flex items-center space-x-2 text-xs bg-emerald-50/80 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-slate-700 font-medium shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span className="text-emerald-900 font-bold">CRR / SLR: 24.8% COMPLIANT</span>
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
            placeholder="Search CIF, Account #, UTR, Branch Code, or General Ledger..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition placeholder:text-slate-400 shadow-inner font-sans"
          />
        </div>
      </div>

      {/* Right: Branch Info, Notifications & Executive Profile */}
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

        {/* Interactive Notifications Center */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition focus:outline-none"
            title="System & Compliance Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-200/90 p-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-900 via-emerald-850 to-[#06231D] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-emerald-300" />
                  <span className="text-xs font-bold tracking-wide uppercase">Operational Alerts</span>
                  <span className="px-1.5 py-0.2 bg-emerald-700 text-emerald-100 rounded-full text-[10px] font-mono font-bold">
                    {unreadCount} new
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-emerald-300 hover:text-white font-medium underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs gap-1.5 font-semibold">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeFilter === 'ALL'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('UNREAD')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeFilter === 'UNREAD'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveFilter('URGENT')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeFilter === 'URGENT'
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Urgent
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications in this category.
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-emerald-50/50 cursor-pointer transition flex items-start space-x-3 ${
                        !n.isRead ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.severity === 'HIGH' ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                        ) : n.type === 'APPROVAL' ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                          {n.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span>View in module</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>

                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate('/dashboard');
                  }}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 mx-auto"
                >
                  <span>Open Head Office Command Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Executive Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationOpen(false);
            }}
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
