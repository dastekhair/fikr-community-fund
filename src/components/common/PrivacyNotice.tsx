import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { CORE_PRINCIPLES } from '../../lib/constants';

interface PrivacyNoticeProps {
  compact?: boolean;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 py-1.5 px-3 rounded-lg bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800/60">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span><strong>Beneficiary Dignity Covenant:</strong> Identifying details are restricted to Core Members only.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 sm:p-5 bg-neutral-50 dark:bg-[#151518] border border-neutral-200/80 dark:border-neutral-800/80">
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Privacy & Beneficiary Dignity Covenant
          </h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {CORE_PRINCIPLES.mostImportantPrinciple}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-500 pt-1 font-medium">
            🔒 {CORE_PRINCIPLES.privacyRule}
          </p>
        </div>
      </div>
    </div>
  );
};
