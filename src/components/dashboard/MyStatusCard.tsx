import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Button } from '../common/Button';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import {
  getMemberAllTimeTotal,
  getMemberLastContribution,
  getMemberCycleStatus,
} from '../../lib/contributionUtils';

export const MyStatusCard: React.FC = () => {
  const { currentUser } = useAuth();
  const { members, contributions, loading } = useData();

  const currentMember = useMemo(() => {
    if (!currentUser) return null;
    return (
      members.find(
        (m) =>
          m.id === currentUser.id ||
          (m.uid && m.uid === currentUser.id) ||
          (m.email &&
            currentUser.email &&
            m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
          m.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
      ) || null
    );
  }, [members, currentUser]);

  const allTimeTotal = useMemo(() => {
    if (!currentMember) return 0;
    return getMemberAllTimeTotal(currentMember, contributions);
  }, [currentMember, contributions]);

  const lastContribution = useMemo(() => {
    if (!currentMember) return null;
    return getMemberLastContribution(currentMember, contributions);
  }, [currentMember, contributions]);

  const cycleStatus = useMemo(() => {
    if (!currentMember) return null;
    return getMemberCycleStatus(currentMember, contributions);
  }, [currentMember, contributions]);

  // Only active logged-in core members see this card
  if (!currentUser || !currentUser.isActive || !currentMember || !currentMember.isActive) {
    return null;
  }

  const firstName = currentUser.name.split(' ')[0] || currentUser.name;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
      {/* Top greeting & Matrix action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e4dd]/70 dark:border-[#1f261f] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>My Core Member Status</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
            Assalamu Alaikum, {firstName}
          </h2>
          <p className="text-xs text-[#737672] dark:text-[#a3aba1] mt-0.5 font-normal">
            Your personal contribution standing for the active cycle.
          </p>
        </div>

        <Link to="/contributions">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            View in Matrix
          </Button>
        </Link>
      </div>

      {/* Cycle Status and Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Cycle Status */}
        <div className="p-4 rounded-xl bg-[#f0f3ee]/60 dark:bg-[#181d18] border border-[#e0e4dd]/70 dark:border-[#1f261f] space-y-2">
          <div className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider">
            Current Cycle Status
          </div>
          <div>
            {cycleStatus?.status === 'paid' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Paid ✓
                </span>
                <div className="text-xs text-[#454745] dark:text-[#a3aba1]">
                  {formatCurrency(cycleStatus.amount)} contributed
                  {cycleStatus.contribution?.paidAt
                    ? ` on ${formatShortDate(cycleStatus.contribution.paidAt)}`
                    : ''}
                </div>
              </div>
            )}
            {cycleStatus?.status === 'pending' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/70">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
                <div className="text-xs text-[#454745] dark:text-[#a3aba1]">
                  {formatCurrency(cycleStatus.amount)} awaiting Treasurer confirmation
                </div>
              </div>
            )}
            {cycleStatus?.status === 'due' && (
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Due
                </span>
                <div className="text-xs text-[#454745] dark:text-[#a3aba1]">
                  ₹{cycleStatus.amount} due for {cycleStatus.cycleLabel}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My All-Time Contributed */}
        <div className="p-4 rounded-xl bg-[#f0f3ee]/60 dark:bg-[#181d18] border border-[#e0e4dd]/70 dark:border-[#1f261f] space-y-1">
          <div className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>My All-Time Contributed</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(allTimeTotal)}
          </div>
          <div className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
            Across all verified cycles
          </div>
        </div>

        {/* Last Contribution */}
        <div className="p-4 rounded-xl bg-[#f0f3ee]/60 dark:bg-[#181d18] border border-[#e0e4dd]/70 dark:border-[#1f261f] space-y-1">
          <div className="text-[11px] font-semibold text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <span>Last Contribution</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-[#0e0f0c] dark:text-[#f4f6f3]">
            {lastContribution ? (
              <>
                {formatCurrency(lastContribution.amount)}
                <span className="text-xs font-normal text-[#737672] dark:text-[#a3aba1] ml-1.5">
                  ({lastContribution.paidAt ? formatShortDate(lastContribution.paidAt) : 'Recorded'})
                </span>
              </>
            ) : (
              <span className="text-xs font-normal text-[#737672] dark:text-[#a3aba1]">
                No recorded contributions
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
            {lastContribution?.paymentMethod ? `Via ${lastContribution.paymentMethod}` : 'Member ledger'}
          </div>
        </div>
      </div>
    </div>
  );
};
