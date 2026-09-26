import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ReceiptText,
  Search,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CategoryBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDate, formatShortDate } from '../lib/utils';
import { CaseCategory, Withdrawal } from '../types';
import { CASE_CATEGORIES } from '../lib/constants';

export const PublicWithdrawalsPage: React.FC = () => {
  const { withdrawals, fundStats } = useData();
  const { tier } = useAuth();
  const isCoreMember = tier === 'core_member';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredWithdrawals = withdrawals.filter((w: Withdrawal) => {
    const matchesSearch =
      w.remark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.linkedCaseNumber && w.linkedCaseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.purposeCategory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || w.purposeCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredAmount = filteredWithdrawals.reduce((sum: number, w: Withdrawal) => sum + w.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <ReceiptText className="w-4 h-4" />
            <span>Public Transparency Showcase</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Withdrawal & Assistance Ledger
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            A permanent chronological record of all fund disbursements. Beneficiary identities are strictly protected per our founding covenant.
          </p>
        </div>

        {/* Write action for Core Members */}
        {isCoreMember && (
          <Link to="/withdrawals/new">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Record New Withdrawal
            </Button>
          </Link>
        )}
      </div>

      {/* Summary highlight pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Assistance Released</div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {formatCurrency(fundStats.totalReleased)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Across {withdrawals.length} disbursed interventions</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Remaining Fund Reserve</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(fundStats.currentBalance)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Ready for immediate assistance</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 font-medium">Beneficiary Dignity</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white mt-1">100% Identity Protected</div>
            <div className="text-[11px] text-neutral-400">Zero public exposure</div>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600/30" />
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by remark, category, or case number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All Categories ({withdrawals.length})
          </button>
          {CASE_CATEGORIES.map((cat: CaseCategory) => {
            const count = withdrawals.filter((w: Withdrawal) => w.purposeCategory === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 sm:px-6">Disbursement Date</th>
                <th className="py-4 px-4 sm:px-6">Category</th>
                <th className="py-4 px-4 sm:px-6">Public Purpose / Remark</th>
                <th className="py-4 px-4 sm:px-6">Case Ref</th>
                <th className="py-4 px-4 sm:px-6 text-right">Amount Released</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    No withdrawals match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w: Withdrawal) => (
                  <tr key={w.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-mono text-neutral-500">
                      <div>{formatShortDate(w.timestamp)}</div>
                      <div className="text-[10px] text-neutral-400">
                        {formatDate(w.timestamp).includes(',') ? formatDate(w.timestamp).split(',')[1]?.trim() : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <CategoryBadge category={w.purposeCategory} />
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-medium text-neutral-900 dark:text-white leading-relaxed">
                        {w.remark}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Released by {w.recordedBy}
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {w.linkedCaseId && isCoreMember ? (
                        <Link
                          to={`/cases/${w.linkedCaseId}`}
                          className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          {w.linkedCaseNumber}
                        </Link>
                      ) : (
                        <span className="font-mono text-neutral-500">{w.linkedCaseNumber || '—'}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span className="font-bold text-neutral-900 dark:text-white text-sm">
                        {formatCurrency(w.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredWithdrawals.length > 0 && (
              <tfoot className="bg-neutral-50/80 dark:bg-neutral-900/40 border-t border-neutral-200/80 dark:border-neutral-800 font-semibold text-neutral-900 dark:text-white">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 sm:px-6 text-right">
                    Total Filtered Releases ({filteredWithdrawals.length} items):
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right text-rose-600 dark:text-rose-400 font-bold">
                    {formatCurrency(totalFilteredAmount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
