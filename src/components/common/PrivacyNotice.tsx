import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { CORE_PRINCIPLES } from '../../lib/constants';

interface PrivacyNoticeProps {
  compact?: boolean;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#454745] dark:text-[#a3aba1] py-2 px-4 rounded-full bg-[#e8ebe6]/80 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span><strong>Beneficiary Dignity Covenant:</strong> Identifying details are restricted to Core Members only.</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
            Privacy & Beneficiary Dignity Covenant
          </h4>
          <p className="text-xs text-[#454745] dark:text-[#a3aba1] leading-relaxed">
            {CORE_PRINCIPLES.mostImportantPrinciple}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 font-medium">
            🔒 {CORE_PRINCIPLES.privacyRule}
          </p>
        </div>
      </div>
    </div>
  );
};
