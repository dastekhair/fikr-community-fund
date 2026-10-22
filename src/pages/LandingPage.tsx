import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  HeartHandshake,
  Users,
  CircleDollarSign,
  ReceiptText,
  Clock,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { BalanceChart } from '../components/charts/BalanceChart';
import { Button } from '../components/common/Button';
import { WhatsAppActions } from '../components/common/WhatsAppActions';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { CategoryBadge } from '../components/common/Badge';
import { TableRowSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatShortDate } from '../lib/utils';
import { CORE_PRINCIPLES } from '../lib/constants';
import { Withdrawal } from '../types';

export const LandingPage: React.FC = () => {
  const { fundStats, ledger, withdrawals, loading, errors, timedOut } = useData();
  const { tier } = useAuth();
  const isCoreMember = tier === 'core_member';

  const recentWithdrawals = withdrawals.slice(0, 5);

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {/* Subtle status tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Community Fund • 100% Direct Non-Custodial Distribution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3] leading-[1.1]">
            Small Weekly Giving. <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Real Tangible Impact.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#454745] dark:text-[#a3aba1] max-w-2xl mx-auto font-normal leading-relaxed">
            A mutual assistance fund where members contribute ₹100 weekly, collectively inspect genuine ground-level needs, and release aid with complete transparency and dignity.
          </p>

          {/* CTAs & WhatsApp Share (visible to Core Members) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/withdrawals">
              <Button variant="secondary" size="lg" icon={<ReceiptText className="w-4 h-4" />}>
                View Public Withdrawal Ledger
              </Button>
            </Link>

            {isCoreMember ? (
              <Link to="/cases">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  Go to Active Cases
                </Button>
              </Link>
            ) : (
              <Link to="/about">
                <Button variant="outline" size="lg">
                  Read Founding Proposal
                </Button>
              </Link>
            )}
          </div>

          {/* Core Member WhatsApp Quick Action Toolbar */}
          {isCoreMember && (
            <div className="pt-3 flex items-center justify-center">
              <div className="p-2.5 rounded-2xl bg-[#e8ebe6]/70 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f]">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                    Core Member Tools:
                  </span>
                  <WhatsAppActions />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Transparency Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
              Fund Transparency Dashboard
            </h2>
            <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
              Live aggregate figures updated on every verified transaction.
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Updated Realtime
          </div>
        </div>

        {/* Timeout or Connection Warning */}
        {timedOut && loading && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs text-center">
            Loading is taking longer than expected. Please check your network connection or reload the page.
          </div>
        )}

        {(errors.contributions || errors.withdrawals) && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-center">
            {errors.contributions || errors.withdrawals}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Ever Collected"
            value={formatCurrency(fundStats.totalCollected)}
            subtext="Collected via weekly member contributions"
            icon={<CircleDollarSign className="w-4 h-4 text-emerald-600" />}
            loading={loading}
          />

          <StatCard
            label="Total Released"
            value={formatCurrency(fundStats.totalReleased)}
            subtext="Disbursed directly for verified community cases"
            icon={<HeartHandshake className="w-4 h-4 text-sky-600" />}
            loading={loading}
          />

          <StatCard
            label="Current Available Balance"
            value={formatCurrency(fundStats.currentBalance)}
            subtext="Available immediately for urgent emergency relief"
            highlight={true}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            loading={loading}
          />

          <StatCard
            label="Cases Helped"
            value={fundStats.casesHelped}
            subtext={`${fundStats.activeContributors} active core contributing members`}
            icon={<Users className="w-4 h-4 text-purple-600" />}
            loading={loading}
          />
        </div>
      </section>

      {/* Fund Growth & Balance Progression Chart */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                Reserve Balance & Movement
              </h3>
              <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
                Visualizing cumulative weekly collections vs. direct case releases
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#454745] dark:text-[#a3aba1]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Fund Reserve Curve
              </span>
            </div>
          </div>

          <BalanceChart ledger={ledger} height={220} />
        </div>
      </section>

      {/* Recent Public Withdrawals Ledger Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
              Recent Assistance Releases
            </h2>
            <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
              Public proof of disbursed funds. Sensitive beneficiary details are omitted to protect privacy.
            </p>
          </div>
          <Link to="/withdrawals">
            <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Full Withdrawal Ledger ({withdrawals.length})
            </Button>
          </Link>
        </div>

        {/* Mobile Stacked Cards View (< md) */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <>
              <MobileCardSkeleton />
              <MobileCardSkeleton />
              <MobileCardSkeleton />
            </>
          ) : recentWithdrawals.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="w-5 h-5 text-emerald-600" />}
              title="No withdrawals yet"
              description="Approved emergency assistance disbursements will be posted here."
            />
          ) : (
            recentWithdrawals.map((w: Withdrawal) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#e0e4dd]/60 dark:border-[#1f261f] pb-2">
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(w.amount)}
                  </span>
                  <CategoryBadge category={w.purposeCategory} />
                </div>

                <p className="text-xs font-medium text-[#0e0f0c] dark:text-[#f4f6f3] leading-relaxed line-clamp-2">
                  {w.remark}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#737672] dark:text-[#a3aba1] pt-1 border-t border-[#e0e4dd]/50 dark:border-[#1f261f]/60">
                  <span className="font-mono">{formatShortDate(w.timestamp)}</span>
                  <span>Case Ref: <strong className="font-mono text-[#454745] dark:text-[#a3aba1]">{w.linkedCaseNumber || '—'}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f0f3ee] dark:bg-[#181d18] border-b border-[#e0e4dd] dark:border-[#1f261f] text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6">Category</th>
                  <th className="py-3.5 px-4 sm:px-6">Sanitized Purpose / Remark</th>
                  <th className="py-3.5 px-4 sm:px-6">Case Ref</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amount Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e4dd]/70 dark:divide-[#1f261f] text-[#454745] dark:text-[#a3aba1]">
                {loading ? (
                  <>
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                  </>
                ) : recentWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ReceiptText className="w-5 h-5 text-neutral-400" />
                        <span className="text-xs font-medium">No disbursements recorded yet.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentWithdrawals.map((w: Withdrawal) => (
                    <tr key={w.id} className="hover:bg-[#f0f3ee]/50 dark:hover:bg-[#181d18]/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                        {formatShortDate(w.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <CategoryBadge category={w.purposeCategory} />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-[#0e0f0c] dark:text-[#f4f6f3] max-w-xs sm:max-w-md truncate">
                        {w.remark}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                        {w.linkedCaseNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-rose-600 dark:text-rose-400">
                        - {formatCurrency(w.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The 6-Step Operational Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
            How Fikr Operates
          </h2>
          <p className="text-xs text-[#737672] dark:text-[#a3aba1]">
            A transparent, collaborative, and strictly accountable 6-step lifecycle for every case.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'Collect', desc: 'Weekly ₹100 member contributions deposited into one pool.' },
            { step: '2', title: 'Verify', desc: 'Ground-level inspection (pharmacies, schools, home visits).' },
            { step: '3', title: 'Discuss', desc: 'Case presented to core group with genuine need verification.' },
            { step: '4', title: 'Decide', desc: 'Consensus voting on exact amount required to solve problem.' },
            { step: '5', title: 'Release', desc: 'Treasurer disburses funds directly to supplier/school/case.' },
            { step: '6', title: 'Record', desc: 'Auto-balanced ledger entry with timestamp & receipt.' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] space-y-2 relative shadow-xs"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                {item.step}
              </div>
              <h4 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#737672] dark:text-[#a3aba1] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy Guarantee & Covenant */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PrivacyNotice />
      </section>
    </div>
  );
};
