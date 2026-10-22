import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`bg-[#e0e4dd] dark:bg-[#1f261f] rounded-lg skeleton-shimmer ${className}`}
      aria-hidden="true"
    />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
};

export const MemberRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
};

export const CaseCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="sm:text-right space-y-1.5 shrink-0">
          <Skeleton className="h-3 w-20 sm:ml-auto" />
          <Skeleton className="h-6 w-24 sm:ml-auto" />
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number; cols?: number }> = ({ columns = 5, cols }) => {
  const count = cols ?? columns;
  return (
    <tr className="border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
      {Array.from({ length: count }).map((_, i) => (
        <td key={i} className="py-4 px-4 sm:px-6">
          <Skeleton className={`h-4 ${i === count - 1 ? 'w-20 ml-auto' : 'w-28'}`} />
        </td>
      ))}
    </tr>
  );
};

export const MobileCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e0e4dd]/70 dark:border-[#1f261f]">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
    </div>
  );
};
