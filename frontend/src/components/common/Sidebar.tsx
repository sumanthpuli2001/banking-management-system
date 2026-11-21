import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvatarByRoleOrUser } from '../../utils/avatars';
import {
  LayoutDashboard,
  Building,
  Users,
  UserCheck,
  CreditCard,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  CheckSquare,
  ShieldAlert,
  Layers,
  ShieldCheck,
  BookOpen,
  Scale,
  LogOut,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, hasRole, logout } = useAuth();

  const navItems = [
    // Executive Oversight
    {
      name: 'Head Office Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      group: 'Executive Oversight',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR']),
    },
    {
      name: 'Regulatory & Liquidity Hub',
      path: '/regulatory',
      icon: ShieldCheck,
      group: 'Executive Oversight',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR']),
    },
    {
      name: 'Branch Performance',
      path: '/branches/comparison',
      icon: Layers,
      group: 'Executive Oversight',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR']),
    },
    {
      name: 'My Retail Banking',
      path: '/customer-portal',
      icon: UserCheck,
      group: 'Executive Oversight',
      show: hasRole(['CUSTOMER', 'SUPER_ADMIN']),
    },

    // Organization Control
    {
      name: 'Branch Management',
      path: '/branches',
      icon: Building,
      group: 'Organization Control',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER']),
    },
    {
      name: 'Employee Directory',
      path: '/employees',
      icon: Users,
      group: 'Organization Control',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER']),
    },

    // Counter & Cash Operations
    {
      name: 'Cashier Till & Vault',
      path: '/branch-cash',
      icon: Landmark,
      group: 'Counter Operations',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER', 'CASHIER', 'AUDITOR']),
    },
    {
      name: 'Fund Transfers',
      path: '/transfers',
      icon: ArrowLeftRight,
      group: 'Counter Operations',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'CUSTOMER']),
    },
    {
      name: 'Cash Counter Desk',
      path: '/deposits',
      icon: CreditCard,
      group: 'Counter Operations',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER']),
    },
    {
      name: 'Bank Accounts',
      path: '/accounts',
      icon: CreditCard,
      group: 'Counter Operations',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER']),
    },
    {
      name: 'Customer Onboarding',
      path: '/customers',
      icon: UserCheck,
      group: 'Counter Operations',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE']),
    },

    // Credit & Treasury
    {
      name: 'Loan Desk',
      path: '/loans',
      icon: Building,
      group: 'Credit & Treasury',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER']),
    },
    {
      name: 'Term & Recurring Deposits',
      path: '/deposits/term',
      icon: PiggyBank,
      group: 'Credit & Treasury',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER']),
    },

    // Governance & Audit
    {
      name: 'Maker-Checker Queue',
      path: '/approvals',
      icon: CheckSquare,
      badge: '4',
      group: 'Governance & Audit',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER']),
    },
    {
      name: 'General Ledger & COA',
      path: '/accounting',
      icon: BookOpen,
      group: 'Governance & Audit',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER']),
    },
    {
      name: 'Ledger Reconciliation',
      path: '/reconciliation',
      icon: Scale,
      group: 'Governance & Audit',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER']),
    },
    {
      name: 'AML & KYC Compliance',
      path: '/compliance',
      icon: ShieldAlert,
      badge: 'AML',
      group: 'Governance & Audit',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER']),
    },
    {
      name: 'Audit Forensics',
      path: '/audit',
      icon: ShieldAlert,
      group: 'Governance & Audit',
      show: hasRole(['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR']),
    },
  ];

  const primaryRole = user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF';

  const executiveItems = navItems.filter((i) => i.show && i.group === 'Executive Oversight');
  const orgItems = navItems.filter((i) => i.show && i.group === 'Organization Control');
  const counterItems = navItems.filter((i) => i.show && i.group === 'Counter Operations');
  const creditItems = navItems.filter((i) => i.show && i.group === 'Credit & Treasury');
  const auditItems = navItems.filter((i) => i.show && i.group === 'Governance & Audit');

  const renderNavGroup = (title: string, items: typeof navItems) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 pt-3 first:pt-0">
        <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
          <span>{title}</span>
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-300 border-l-[3px] border-emerald-400 shadow-[inset_0_0_12px_rgba(16,184,129,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                }`
              }
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-emerald-400" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#071326] via-[#0A1B36] to-[#050E1F] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl select-none relative z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-950/60 ring-1 ring-white/20">
          <Landmark className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-white tracking-wider">APEX BANK</span>
            <span className="text-emerald-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 tracking-wider">
              CBS
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">
            RBI Regulated • Scheduled Bank
          </p>
        </div>
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {renderNavGroup('Treasury & Executive', executiveItems)}
        {renderNavGroup('Branch Network & HR', orgItems)}
        {renderNavGroup('Counter & Cash Operations', counterItems)}
        {renderNavGroup('Credit & Advances', creditItems)}
        {renderNavGroup('Governance & Risk', auditItems)}
      </nav>

      {/* User Status Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={getAvatarByRoleOrUser(user?.roles?.[0] || user?.username, user?.fullName)}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-slate-700 ring-2 ring-emerald-500/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&auto=format&fit=crop&q=80';
                }}
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 animate-pulse" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.fullName || user?.username || 'Executive Officer'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block text-[9px] font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 uppercase">
                  {primaryRole}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {user?.branchCode || 'HO-001'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
