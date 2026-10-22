import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  actionHref,
  className = ''
}) => {
  return (
    <div
      className={`py-12 sm:py-16 px-6 text-center rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-3.5 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#f0f3ee] dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] text-neutral-500 dark:text-neutral-400 flex items-center justify-center mx-auto shadow-xs">
        {icon}
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-[#737672] dark:text-[#a3aba1] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="sm" icon={actionIcon}>
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
