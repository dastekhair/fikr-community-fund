import React, { useState } from 'react';
import {
  Receipt,
  Upload,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { BalanceChart } from '../components/charts/BalanceChart';
import { formatCurrency, formatDate, exportLedgerToCSV } from '../lib/utils';
import { LedgerEntry } from '../types';

export const LedgerPage: React.FC = () => {
  const { ledger, fundStats } = useData();
  const { currentUser } = useAuth();

  const [typeFilter, setTypeFilter] = useState<'all' | 'contribution' | 'withdrawal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLedger = ledger.filter((entry: LedgerEntry) => {
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const matchesSearch =
      entry.purposeOrSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.caseReference && entry.caseReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.recordedBy.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    exportLedgerToCSV(ledger, `fikr-complete-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Official Financial Records</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            General Transaction Ledger
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Auto-calculated running balance tracking all member contributions received and authorized assistance disbursements.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleExportCSV}
          icon={<Upload className="w-4 h-4" />}
        >
          Export CSV (Full History)
        </Button>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Received Inflow</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(fundStats.totalCollected)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Confirmed member contributions</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Assistance Outflow</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(fundStats.totalReleased)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Directly released for approved cases</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Current Calculated Balance</div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-white mt-1">
            {formatCurrency(fundStats.currentBalance)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Auto-calculated from {ledger.length} verified events
          </div>
        </div>
      </div>

      {/* Mini Balance Chart Preview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Running Balance Trajectory
        </div>
        <BalanceChart ledger={ledger} height={160} />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All Events ({ledger.length})
          </button>
          <button
            onClick={() => setTypeFilter('contribution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'contribution'
                ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Contributions Inflow
          </button>
          <button
            onClick={() => setTypeFilter('withdrawal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'withdrawal'
                ? 'bg-white dark:bg-[#121215] text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Withdrawals Outflow
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search entries by purpose, case ref, or recorder..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Mobile Stacked Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 text-xs">
            No transactions match the selected filter.
          </div>
        ) : (
          filteredLedger.map((entry: LedgerEntry) => {
            const isContribution = entry.type === 'contribution';
            return (
              <div
                key={entry.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3"
              >
                {/* Header: Type Badge & Amount */}
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-2.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    isContribution
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  }`}>
                    {isContribution ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {isContribution ? 'Inflow' : 'Disbursement'}
                  </span>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-neutral-400">
                      Amount
                    </div>
                    <div className={`text-base font-bold ${
                      isContribution ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isContribution ? `+ ${formatCurrency(entry.amount)}` : `- ${formatCurrency(entry.amount)}`}
                    </div>
                  </div>
                </div>

                {/* Purpose or Source */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-neutral-400">
                    Purpose / Reference
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-relaxed">
                    {entry.purposeOrSource}
                  </p>
                </div>

                {/* Metadata Grid: Running Balance & Case Ref */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px]">
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Running Balance</div>
                    <div className="font-mono text-neutral-900 dark:text-white font-bold text-xs mt-0.5">
                      {formatCurrency(entry.runningBalance)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Case Ref</div>
                    <div className="font-mono text-neutral-600 dark:text-neutral-400 mt-0.5">
                      {entry.caseReference || '—'}
                    </div>
                  </div>
                </div>

                {/* Footer: Date & Recorded By */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-100/60 dark:border-neutral-800/60 text-[10px] text-neutral-400">
                  <span className="font-mono">{formatDate(entry.timestamp)}</span>
                  <span>Recorded by <strong className="text-neutral-600 dark:text-neutral-300">{entry.recordedBy}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 sm:px-6">Date & Time</th>
                <th className="py-4 px-4 sm:px-6">Type</th>
                <th className="py-4 px-4 sm:px-6">Purpose / Reference</th>
                <th className="py-4 px-4 sm:px-6">Case Ref</th>
                <th className="py-4 px-4 sm:px-6">Recorded By</th>
                <th className="py-4 px-4 sm:px-6 text-right">Amount</th>
                <th className="py-4 px-4 sm:px-6 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry: LedgerEntry) => {
                  const isContribution = entry.type === 'contribution';
                  return (
                    <tr key={entry.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isContribution
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isContribution ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isContribution ? 'Inflow' : 'Disbursement'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900 dark:text-white max-w-sm sm:max-w-md">
                        {entry.purposeOrSource}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                        {entry.caseReference || '—'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-neutral-500 whitespace-nowrap">
                        {entry.recordedBy}
                      </td>
                      <td className={`py-3.5 px-4 sm:px-6 text-right font-bold whitespace-nowrap ${
                        isContribution ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isContribution ? `+ ${formatCurrency(entry.amount)}` : `- ${formatCurrency(entry.amount)}`}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-neutral-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
