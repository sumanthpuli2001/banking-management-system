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
  Building,
  BookOpen,
  X,
  Sparkles
} from 'lucide-react';
import { InterviewGuideModal } from './InterviewGuideModal';
import { getAvatarByRoleOrUser } from '../../utils/avatars';

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
  const [showInterviewGuide, setShowInterviewGuide] = useState<boolean>(false);
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
    <>
      <header className="h-[52px] bg-[#071326] border-b border-slate-800/90 px-4 sm:px-6 flex items-center justify-between shadow-md sticky top-0 z-30 transition-all text-white">
        {/* Global Search Bar */}
        <div className="flex items-center gap-3 w-72 sm:w-80">
          <div className="relative w-full group">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="text"
              placeholder="Search CIF, Account #, UTR, Branch..."
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500/20 text-xs pl-8 pr-8 py-1.5 rounded-lg outline-none transition-all text-white placeholder:text-slate-400 font-medium font-sans shadow-inner"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold bg-slate-800 border border-slate-700 px-1 py-0.2 rounded text-slate-400 shadow-2xs pointer-events-none">
              /
            </kbd>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Telemetry & Compliance Status */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>RTGS/NEFT Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/90 text-slate-200 border border-slate-700">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>RBI CRR/SLR 24.8%</span>
            </div>
          </div>

          {/* CBS Operations & Architecture Walkthrough Manual */}
          <button
            type="button"
            onClick={() => setShowInterviewGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-xs font-bold shadow-md transition-all border border-emerald-600/50"
            title="Open Core Banking Solution (CBS) Operations & Architecture Manual"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">CBS Guide</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              className="relative p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/90 rounded-lg transition"
              title="System & Compliance Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-600 text-white text-[8px] font-mono font-bold flex items-center justify-center ring-1 ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                <div className="p-3.5 bg-gradient-to-r from-slate-950 via-[#06231D] to-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Operational Alerts</span>
                    <span className="px-2 py-0.5 bg-emerald-800 text-emerald-100 rounded-full text-[10px] font-bold">
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
                        ? 'bg-emerald-800 text-white'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveFilter('UNREAD')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      activeFilter === 'UNREAD'
                        ? 'bg-emerald-800 text-white'
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
                            <span>Open in module</span>
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

          {/* User Identity Pill */}
          <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-700/80">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.fullName || user?.username || 'Executive Officer'}
              </p>
              <span className="inline-block text-[9px] font-semibold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                {user?.roles?.[0]?.replace('ROLE_', '') || 'HEAD_OFFICE_ADMIN'}
              </span>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationOpen(false);
                }}
                className="relative rounded-lg overflow-hidden focus:outline-none ring-1 ring-emerald-500/40 hover:ring-emerald-400 transition shadow-sm"
              >
                <img
                  src={getAvatarByRoleOrUser(user?.roles?.[0] || user?.username, user?.fullName)}
                  alt="Avatar"
                  className="w-7 h-7 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80';
                  }}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.fullName || user?.username}</p>
                    <p className="text-[11px] text-slate-500">{user?.email || 'admin@apexbank.in'}</p>
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1.5">
                      BRANCH: {user?.branchCode || 'HO-001'} (HEAD OFFICE)
                    </span>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center justify-between"
                    >
                      <span>Command Center</span>
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setShowInterviewGuide(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-xl transition flex items-center justify-between"
                    >
                      <span>Interview Guide</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Workflow & Interview Guide Modal */}
      <InterviewGuideModal
        isOpen={showInterviewGuide}
        onClose={() => setShowInterviewGuide(false)}
      />
    </>
  );
};
