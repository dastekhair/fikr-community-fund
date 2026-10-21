import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlight = false
}) => {
  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 ${
        highlight
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/20'
          : 'bg-white dark:bg-[#131713] border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-[#f0f3ee] dark:bg-[#181d18] text-[#0e0f0c] dark:text-[#f4f6f3]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
          {subtext}
        </p>
      )}
    </div>
  );
};
