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
import { formatCurrency, formatShortDate } from '../lib/utils';
import { CORE_PRINCIPLES } from '../lib/constants';
import { Withdrawal } from '../types';

export const LandingPage: React.FC = () => {
  const { fundStats, ledger, withdrawals } = useData();
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

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-neutral-900 dark:text-white leading-[1.1]">
            Small Weekly Giving. <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Real Tangible Impact.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed">
            A small 9-person mutual assistance fund where members contribute ₹100 weekly, collectively inspect genuine ground-level needs, and release aid with complete transparency and dignity.
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
              <div className="p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
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
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Fund Transparency Dashboard
            </h2>
            <p className="text-xs text-neutral-500">
              Live aggregate figures updated on every verified transaction.
            </p>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Updated Realtime
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Ever Collected"
            value={formatCurrency(fundStats.totalCollected)}
            subtext="Collected via weekly member contributions"
            icon={<CircleDollarSign className="w-4 h-4 text-emerald-600" />}
          />

          <StatCard
            label="Total Released"
            value={formatCurrency(fundStats.totalReleased)}
            subtext="Disbursed directly for verified community cases"
            icon={<HeartHandshake className="w-4 h-4 text-sky-600" />}
          />

          <StatCard
            label="Current Available Balance"
            value={formatCurrency(fundStats.currentBalance)}
            subtext="Available immediately for urgent emergency relief"
            highlight={true}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          />

          <StatCard
            label="Cases Helped"
            value={fundStats.casesHelped}
            subtext={`${fundStats.activeContributors} active core contributing members`}
            icon={<Users className="w-4 h-4 text-purple-600" />}
          />
        </div>
      </section>

      {/* Fund Growth & Balance Progression Chart */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Reserve Balance & Movement
              </h3>
              <p className="text-xs text-neutral-500">
                Visualizing cumulative weekly collections vs. direct case releases
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Fund Reserve Curve
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
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Recent Assistance Releases
            </h2>
            <p className="text-xs text-neutral-500">
              Public proof of disbursed funds. Sensitive beneficiary details are omitted to protect privacy.
            </p>
          </div>
          <Link to="/withdrawals">
            <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Full Withdrawal Ledger ({withdrawals.length})
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4 sm:px-6">Category</th>
                  <th className="py-3.5 px-4 sm:px-6">Sanitized Purpose / Remark</th>
                  <th className="py-3.5 px-4 sm:px-6">Case Ref</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amount Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                {recentWithdrawals.map((w: Withdrawal) => (
                  <tr key={w.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                      {formatShortDate(w.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <CategoryBadge category={w.purposeCategory} />
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900 dark:text-white max-w-xs sm:max-w-md truncate">
                      {w.remark}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                      {w.linkedCaseNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(w.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The 6-Step Operational Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            How Fikr Operates
          </h2>
          <p className="text-xs text-neutral-500">
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
              className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-2 relative"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                {item.step}
              </div>
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {item.title}
              </h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
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
