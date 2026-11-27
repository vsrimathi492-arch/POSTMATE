import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'blue' | 'navy' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'navy',
  onClick
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
