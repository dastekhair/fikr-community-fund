import React from 'react';
import { CaseStatus, MemberRole, CaseCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate' | 'gold';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    neutral: 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/80',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    blue: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    gold: 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/70 font-semibold',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
    slate: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: CaseStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'Reported':
      return <Badge variant="slate" size={size}><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />Reported</Badge>;
    case 'Under Discussion':
      return <Badge variant="amber" size={size}><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Under Discussion</Badge>;
    case 'Approved':
      return <Badge variant="blue" size={size}><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Approved</Badge>;
    case 'Released':
      return <Badge variant="emerald" size={size}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Funds Released</Badge>;
    case 'Declined':
      return <Badge variant="rose" size={size}><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Declined</Badge>;
    case 'Closed':
      return <Badge variant="neutral" size={size}><span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />Closed</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: MemberRole | 'Supporter' | 'Visitor'; size?: 'sm' | 'md' }> = ({ role, size = 'sm' }) => {
  switch (role) {
    case 'Admin':
      return <Badge variant="gold" size={size}>👑 Admin</Badge>;
    case 'Treasurer':
      return <Badge variant="emerald" size={size}>Treasurer</Badge>;
    case 'Coordinator':
      return <Badge variant="blue" size={size}>Coordinator</Badge>;
    case 'Verification Team':
      return <Badge variant="purple" size={size}>Verification Team</Badge>;
    case 'Core Member':
      return <Badge variant="slate" size={size}>Core Member</Badge>;
    case 'Supporter':
      return <Badge variant="amber" size={size}>Supporter</Badge>;
    case 'Visitor':
      return <Badge variant="neutral" size={size}>Public</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{role}</Badge>;
  }
};

export const CategoryBadge: React.FC<{ category: CaseCategory | string; size?: 'sm' | 'md' }> = ({ category, size = 'sm' }) => {
  return (
    <span className={`inline-flex items-center text-xs font-normal text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/90 px-2 py-0.5 rounded-md border border-neutral-200/70 dark:border-neutral-700/60`}>
      {category}
    </span>
  );
};
