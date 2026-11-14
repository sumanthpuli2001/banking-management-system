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
  accentColor?: 'blue' | 'green' | 'amber' | 'red' | 'navy';
  isCurrency?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'blue',
  isCurrency = false,
}) => {
  const colorMap = {
    blue: 'border-l-bank-500 text-bank-600 bg-bank-50/50',
    green: 'border-l-emerald-600 text-emerald-600 bg-emerald-50/50',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50/50',
    red: 'border-l-rose-500 text-rose-600 bg-rose-50/50',
    navy: 'border-l-bank-800 text-bank-800 bg-slatebank-50',
  };

  const iconBgMap = {
    blue: 'bg-bank-100 text-bank-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    navy: 'bg-slatebank-200 text-slatebank-800',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-slatebank-200 shadow-sm border-l-4 ${colorMap[accentColor]} transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slatebank-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-slatebank-900 financial-num">
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
            <p className="text-[11px] text-slatebank-500 mt-1">{subtitle}</p>
          )}
        </div>

        <div className={`p-2.5 rounded-lg ${iconBgMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slatebank-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            {trend.isNeutral ? (
              <Minus className="w-3.5 h-3.5 text-slatebank-400" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span
              className={`font-semibold ${
                trend.isNeutral
                  ? 'text-slatebank-500'
                  : trend.isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          </div>
          <span className="text-[10px] text-slatebank-400 font-medium">vs Prev Period</span>
        </div>
      )}
    </div>
  );
};
