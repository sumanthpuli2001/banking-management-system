import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'gold' | 'green' | 'amber' | 'blue' | 'red' | 'navy';
  isCurrency?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'gold',
  isCurrency = false,
}) => {
  const borderTopMap = {
    gold: 'border-t-4 border-t-amber-500',
    green: 'border-t-4 border-t-emerald-500',
    amber: 'border-t-4 border-t-amber-600',
    blue: 'border-t-4 border-t-slate-800',
    red: 'border-t-4 border-t-rose-500',
    navy: 'border-t-4 border-t-slate-900',
  };

  const iconBgMap = {
    gold: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    amber: 'bg-orange-50 text-orange-700 border border-orange-200/60',
    blue: 'bg-slate-100 text-slate-800 border border-slate-200',
    red: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    navy: 'bg-slate-900 text-amber-400 border border-slate-800',
  };

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] ${borderTopMap[accentColor]} hover:shadow-lg hover:border-amber-300/60 transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 font-mono">
            {title}
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              {isCurrency && typeof value === 'number'
                ? new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(value)
                : value}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>

        <div className={`p-3 rounded-xl shadow-sm ${iconBgMap[accentColor]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {trend.isNeutral ? (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            ) : trend.isPositive ? (
              <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-emerald-200/60">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span>{trend.value}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-rose-200/60">
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                <span>{trend.value}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">vs Prev Fiscal</span>
        </div>
      )}
    </div>
  );
};
