import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  Users,
  UserCheck,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  CheckSquare,
  ShieldAlert,
  Sliders,
  ChevronRight,
  ChevronDown,
  Layers
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
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER'],
        },
      ],
    },
    {
      title: 'COUNTER TRANSACTIONS',
      items: [
        {
          name: 'Cash Deposit',
          path: '/deposits',
          icon: ArrowDownCircle,
          allowedRoles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'],
        },
        {
          name: 'Cash Withdrawal',
          path: '/withdrawals',
          icon: ArrowUpCircle,
          allowedRoles: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'CASHIER'],
        },
        {
          name: 'Fund Transfers',
          path: '/transfers',
          icon: ArrowLeftRight,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER'],
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
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CUSTOMER'],
        },
        {
          name: 'Term & Recurring Deposits',
          path: '/deposits/term',
          icon: PiggyBank,
          allowedRoles: ['SUPER_ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER', 'BANK_EMPLOYEE', 'CUSTOMER'],
        },
      ],
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
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
        {
          name: 'System Parameters',
          path: '/settings',
          icon: Sliders,
          allowedRoles: ['SUPER_ADMIN'],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slatebank-900 border-r border-bank-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0 overflow-y-auto">
      <div className="p-4 space-y-6 flex-1">
        {sections.map((section) => {
          // Filter items by role
          const visibleItems = section.items.filter((item) => {
            if (!item.allowedRoles) return true;
            return item.allowedRoles.some((role) => hasRole(role as any));
          });

          if (visibleItems.length === 0) return null;

          const isCollapsed = !!collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold tracking-wider text-slatebank-400 uppercase hover:text-slatebank-200"
              >
                <span>{section.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slatebank-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slatebank-500" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${
                          isActive
                            ? 'bg-bank-700/80 text-white font-semibold border-l-4 border-bank-400 pl-2 shadow-sm'
                            : 'text-slatebank-300 hover:text-white hover:bg-bank-900/60'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <item.icon className="w-4 h-4 shrink-0 text-bank-300" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-bank-800/80 bg-bank-950/40 text-[11px] text-slatebank-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slatebank-300">Apex Core Engine</span>
          <span className="font-mono text-emerald-400 text-[10px]">OPERATIONAL</span>
        </div>
        <p className="text-[10px] text-slatebank-500 mt-1">
          Server Node: <span className="font-mono text-slatebank-400">IN-MUM-PRD-01</span>
        </p>
      </div>
    </aside>
  );
};
