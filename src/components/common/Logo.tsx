import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group select-none">
      {/* Minimal custom geometric SVG mark representing mutual assistance / giving hands */}
      <div className={`${iconSizes[size]} rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-[1.03]`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Stylized Arabic-inspired flow & mutual uplift line */}
          <path d="M4 12c3-4 6-5 13-5" />
          <path d="M4 16c4-3 8-3.5 13-3.5" />
          <path d="M6 19.5c3-1.2 5.5-1.5 9-1.5" />
          <circle cx="18" cy="7" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold tracking-tight text-neutral-900 dark:text-white ${textSizes[size]}`}>
            Fikr
          </span>
          <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60">
            Fund
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 tracking-normal">
            Dast-e-Khair
          </span>
        )}
      </div>
    </Link>
  );
};
