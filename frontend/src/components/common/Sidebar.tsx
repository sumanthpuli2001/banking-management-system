import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  BookOpen,
  Scale
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sections: NavSection[] = [
    {
      title: 'EXECUTIVE OVERSIGHT',
      items: [
        {
          name: 'Head Office Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR'],
        },
        {
          name: 'My Retail Banking',
          path: '/customer-portal',
          icon: UserCheck,
          allowedRoles: ['CUSTOMER', 'SUPER_ADMIN'],
        },
        {
          name: 'Branch Performance',
          path: '/branches/comparison',
          icon: Layers,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR'],
        },
      ],
    },
    {
      title: 'ORGANIZATION CONTROL',
      items: [
        {
          name: 'Branch Management',
          path: '/branches',
          icon: Building,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER'],
        },
        {
          name: 'Employee Directory',
          path: '/employees',
          icon: Users,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER'],
        },
      ],
    },
    {
      title: 'RETAIL OPERATIONS',
      items: [
        {
          name: 'Customer Onboarding',
          path: '/customers',
          icon: UserCheck,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE'],
        },
        {
          name: 'Bank Accounts',
          path: '/accounts',
          icon: CreditCard,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER'],
        },
      ],
    },
    {
      title: 'COUNTER TRANSACTIONS',
      items: [
        {
          name: 'Cashier Till & Vault',
          path: '/cashier',
          icon: Landmark,
          allowedRoles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'],
        },
        {
          name: 'Fund Transfers',
          path: '/transfers',
          icon: ArrowLeftRight,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CASHIER', 'CUSTOMER'],
        },
      ],
    },
    {
      title: 'CREDIT & TREASURY',
      items: [
        {
          name: 'Loan Desk',
          path: '/loans',
          icon: Landmark,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'],
        },
        {
          name: 'Term & Recurring Deposits',
          path: '/deposits',
          icon: PiggyBank,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER'],
        },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        {
          name: 'General Ledger & COA',
          path: '/accounting',
          icon: BookOpen,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER'],
        },
        {
          name: 'Ledger Reconciliation',
          path: '/reconciliation',
          icon: Scale,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'BRANCH_MANAGER'],
        },
        {
          name: 'Maker-Checker Queue',
          path: '/approvals',
          icon: CheckSquare,
          badge: '4',
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER'],
        },
        {
          name: 'Audit & Compliance',
          path: '/audit',
          icon: ShieldAlert,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'AUDITOR'],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 text-slate-700 flex flex-col shrink-0 select-none shadow-[2px_0_8px_-3px_rgba(0,0,0,0.04)]">
      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {sections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.allowedRoles || item.allowedRoles.some((role: any) => hasRole(role))
          );

          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-400 hover:text-emerald-800 transition uppercase"
              >
                <span>{section.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600/15 via-emerald-600/5 to-transparent text-emerald-950 font-bold border-l-4 border-emerald-600 shadow-xs'
                              : 'text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/60'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center space-x-2.5 truncate">
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive
                                    ? 'text-emerald-700'
                                    : 'text-slate-400 group-hover:text-emerald-700'
                                }`}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>

                            {item.badge && (
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Swiss Wealth Solvency Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-xl p-3 border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Capital Solvency</span>
            </span>
            <span className="text-[10px] font-mono font-extrabold text-emerald-700">100% OK</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Reserve Adequacy: 24.8% CRR/SLR. Full Swiss tier solvency active.
          </p>
        </div>
      </div>
    </aside>
  );
};
