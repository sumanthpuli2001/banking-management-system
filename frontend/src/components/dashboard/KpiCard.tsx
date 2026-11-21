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
  accentColor?: 'emerald' | 'green' | 'teal' | 'blue' | 'red' | 'navy';
  isCurrency?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'emerald',
  isCurrency = false,
}) => {
  const accentGradients = {
    emerald: 'from-emerald-600 to-teal-600',
    green: 'from-emerald-500 to-green-600',
    teal: 'from-teal-600 to-cyan-700',
    blue: 'from-blue-600 to-indigo-700',
    red: 'from-rose-500 to-red-700',
    navy: 'from-slate-800 to-slate-950',
  };

  const iconStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    green: 'bg-green-50 text-green-700 border-green-200/80',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
    navy: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const formattedValue = isCurrency && typeof value === 'number'
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value)
    : value;

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top micro accent gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradients[accentColor]} opacity-90 group-hover:h-1.5 transition-all`} />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${iconStyles[accentColor]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Primary Value Display */}
      <div className="my-1">
        <div className="text-2xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans truncate" title={String(formattedValue)}>
          {formattedValue}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-normal truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Trend & Comparison Strip */}
      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            {trend.isNeutral ? (
              <span className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium text-[10px]">
                <Minus className="w-3 h-3 text-slate-500" />
                <span>{trend.value}</span>
              </span>
            ) : trend.isPositive ? (
              <span className="flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span>{trend.value}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full font-bold text-[10px] border border-rose-200">
                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                <span>{trend.value}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">vs Prev Period</span>
        </div>
      )}
    </div>
  );
};
