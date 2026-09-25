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
          ? 'bg-emerald-950/5 dark:bg-emerald-950/30 border-emerald-500/30 dark:border-emerald-500/20'
          : 'bg-white dark:bg-[#121215] border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        {icon && (
          <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
};
