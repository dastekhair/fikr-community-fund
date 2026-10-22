import React, { useState } from 'react';
import {
  Receipt,
  Upload,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { BalanceChart } from '../components/charts/BalanceChart';
import { formatCurrency, formatDate, exportLedgerToCSV } from '../lib/utils';
import { LedgerEntry } from '../types';
import { StatCardSkeleton, TableRowSkeleton, MobileCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const LedgerPage: React.FC = () => {
  const { ledger, fundStats, voidContribution, voidWithdrawal, loading, timedOut, errors } = useData();
  const { currentUser } = useAuth();
  const isTreasurerOrAdmin = Boolean(currentUser?.isTreasurer || currentUser?.isAdmin);

  const [typeFilter, setTypeFilter] = useState<'all' | 'contribution' | 'withdrawal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Voiding modal state
  const [voidTarget, setVoidTarget] = useState<LedgerEntry | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const handleConfirmVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return;
    try {
      setVoiding(true);
      setVoidError(null);
      const docId = voidTarget.originalDocId || voidTarget.id.replace(/^ledg-[cw]-/, '');
      const recorderName = currentUser?.name || 'Treasurer';

      if (voidTarget.type === 'contribution') {
        await voidContribution(docId, recorderName, voidReason.trim());
      } else {
        await voidWithdrawal(docId, recorderName, voidReason.trim());
      }

      setVoidTarget(null);
      setVoidReason('');
    } catch (err: any) {
      console.error('Void error:', err);
      setVoidError(err.message || 'Failed to void transaction.');
    } finally {
      setVoiding(false);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e0e4dd] dark:border-[#1f261f] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Official Financial Records</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
            General Transaction Ledger
          </h1>
          <p className="text-sm text-[#454745] dark:text-[#a3aba1] mt-1 max-w-2xl font-normal">
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
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
              <div className="text-xs text-[#737672] dark:text-[#a3aba1] font-semibold uppercase tracking-wider">Total Received Inflow</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                {formatCurrency(fundStats.totalCollected)}
              </div>
              <div className="text-[11px] text-[#737672] dark:text-[#a3aba1] mt-0.5 font-normal">Confirmed member contributions</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
              <div className="text-xs text-[#737672] dark:text-[#a3aba1] font-semibold uppercase tracking-wider">Total Assistance Outflow</div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 tracking-tight">
                {formatCurrency(fundStats.totalReleased)}
              </div>
              <div className="text-[11px] text-[#737672] dark:text-[#a3aba1] mt-0.5 font-normal">Directly released for approved cases</div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">Current Calculated Balance</div>
              <div className="text-2xl sm:text-3xl font-black text-[#0e0f0c] dark:text-[#f4f6f3] mt-1 tracking-tight">
                {formatCurrency(fundStats.currentBalance)}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-normal">
                Auto-calculated from {ledger.length} verified events
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini Balance Chart Preview */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#737672] dark:text-[#a3aba1]">
          Running Balance Trajectory
        </div>
        <BalanceChart ledger={ledger} height={160} />
      </div>

      {/* Error or Timeout Notice */}
      {timedOut && loading && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs text-center">
          Loading is taking longer than expected. Please check your network connection or reload the page.
        </div>
      )}

      {errors.contributions && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-center">
          {errors.contributions}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#e8ebe6] dark:bg-[#181d18] p-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'all'
                ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
            }`}
          >
            All Events ({ledger.length})
          </button>
          <button
            onClick={() => setTypeFilter('contribution')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'contribution'
                ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
            }`}
          >
            Contributions Inflow
          </button>
          <button
            onClick={() => setTypeFilter('withdrawal')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === 'withdrawal'
                ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
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
            className="w-full pl-9 pr-4 py-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
          />
        </div>
      </div>

      {/* Mobile Stacked Cards View (< md) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <>
            <MobileCardSkeleton />
            <MobileCardSkeleton />
            <MobileCardSkeleton />
            <MobileCardSkeleton />
          </>
        ) : filteredLedger.length === 0 ? (
          ledger.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-6 h-6 text-emerald-600" />}
              title="No transactions yet"
              description="No verified contribution or withdrawal transactions have been recorded yet."
            />
          ) : (
            <EmptyState
              icon={<Search className="w-6 h-6 text-neutral-400" />}
              title="No matching transactions"
              description="No ledger transactions match the selected filter or search query."
              actionLabel="Reset Filters"
              onAction={() => { setTypeFilter('all'); setSearchQuery(''); }}
            />
          )
        ) : (
          filteredLedger.map((entry: LedgerEntry) => {
            const isContribution = entry.type === 'contribution';
            const isVoided = entry.status === 'voided';
            return (
              <div
                key={entry.id}
                className={`p-4 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-xs space-y-3 transition-opacity ${
                  isVoided ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/30' : ''
                }`}
              >
                {/* Header: Type Badge & Amount */}
                <div className="flex items-center justify-between gap-2 border-b border-[#e0e4dd]/70 dark:border-[#1f261f] pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isVoided
                        ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 line-through'
                        : isContribution
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}>
                      {isContribution ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isContribution ? 'Inflow' : 'Disbursement'}
                    </span>
                    {isVoided && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Voided
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-[#737672] dark:text-[#a3aba1]">
                      Amount
                    </div>
                    <div className={`text-base font-bold ${
                      isVoided
                        ? 'text-neutral-400 dark:text-neutral-500 line-through'
                        : isContribution
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isContribution ? `+ ${formatCurrency(entry.amount)}` : `- ${formatCurrency(entry.amount)}`}
                    </div>
                  </div>
                </div>

                {/* Purpose or Source */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-[#737672] dark:text-[#a3aba1]">
                    Purpose / Reference
                  </div>
                  <p className={`text-xs font-semibold text-[#0e0f0c] dark:text-[#f4f6f3] leading-relaxed ${
                    isVoided ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                  }`}>
                    {entry.purposeOrSource}
                  </p>
                  {isVoided && entry.voidReason && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-normal italic">
                      Void reason: &ldquo;{entry.voidReason}&rdquo; {entry.voidedBy ? `(by ${entry.voidedBy})` : ''}
                    </div>
                  )}
                </div>

                {/* Metadata Grid: Running Balance & Case Ref */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e0e4dd]/70 dark:border-[#1f261f] text-[11px]">
                  <div>
                    <div className="text-[10px] text-[#737672] dark:text-[#a3aba1] uppercase font-semibold">Running Balance</div>
                    <div className="font-mono text-[#0e0f0c] dark:text-[#f4f6f3] font-bold text-xs mt-0.5">
                      {formatCurrency(entry.runningBalance)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#737672] dark:text-[#a3aba1] uppercase font-semibold">Case Ref</div>
                    <div className="font-mono text-[#454745] dark:text-[#a3aba1] mt-0.5">
                      {entry.caseReference || '—'}
                    </div>
                  </div>
                </div>

                {/* Footer: Date, Recorded By, & Void Button */}
                <div className="flex items-center justify-between pt-1 border-t border-[#e0e4dd]/50 dark:border-[#1f261f]/60 text-[10px] text-[#737672] dark:text-[#a3aba1]">
                  <div>
                    <span className="font-mono block">{formatDate(entry.timestamp)}</span>
                    <span>Recorded by <strong className="text-[#0e0f0c] dark:text-[#f4f6f3]">{entry.recordedBy}</strong></span>
                  </div>
                  {isTreasurerOrAdmin && !isVoided && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setVoidTarget(entry);
                        setVoidReason('');
                        setVoidError(null);
                      }}
                    >
                      Void
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f3ee] dark:bg-[#181d18] border-b border-[#e0e4dd] dark:border-[#1f261f] text-[#737672] dark:text-[#a3aba1] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 sm:px-6">Date & Time</th>
                <th className="py-4 px-4 sm:px-6">Type</th>
                <th className="py-4 px-4 sm:px-6">Purpose / Reference</th>
                <th className="py-4 px-4 sm:px-6">Case Ref</th>
                <th className="py-4 px-4 sm:px-6">Recorded By</th>
                <th className="py-4 px-4 sm:px-6 text-right">Amount</th>
                <th className="py-4 px-4 sm:px-6 text-right">Running Balance</th>
                <th className="py-4 px-4 sm:px-6 text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e4dd]/70 dark:divide-[#1f261f] text-[#454745] dark:text-[#a3aba1]">
              {loading ? (
                <>
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                  <TableRowSkeleton cols={8} />
                </>
              ) : filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    {ledger.length === 0 ? (
                      <EmptyState
                        icon={<Layers className="w-6 h-6 text-emerald-600" />}
                        title="No transactions yet"
                        description="No verified contribution or withdrawal transactions have been recorded yet."
                      />
                    ) : (
                      <EmptyState
                        icon={<Search className="w-6 h-6 text-neutral-400" />}
                        title="No matching transactions"
                        description="No ledger transactions match the selected filter or search query."
                        actionLabel="Reset Filters"
                        onAction={() => { setTypeFilter('all'); setSearchQuery(''); }}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry: LedgerEntry) => {
                  const isContribution = entry.type === 'contribution';
                  const isVoided = entry.status === 'voided';
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isVoided
                          ? 'opacity-60 bg-neutral-50/50 dark:bg-neutral-900/20'
                          : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isVoided
                            ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 line-through'
                            : isContribution
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isContribution ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isContribution ? 'Inflow' : 'Disbursement'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-neutral-900 dark:text-white max-w-sm sm:max-w-md">
                        <span className={isVoided ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}>
                          {entry.purposeOrSource}
                        </span>
                        {isVoided && entry.voidReason && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-normal italic mt-0.5">
                            Void reason: &ldquo;{entry.voidReason}&rdquo; {entry.voidedBy ? `(by ${entry.voidedBy})` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-neutral-500">
                        {entry.caseReference || '—'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-neutral-500 whitespace-nowrap">
                        {entry.recordedBy}
                      </td>
                      <td className={`py-3.5 px-4 sm:px-6 text-right font-bold whitespace-nowrap ${
                        isVoided
                          ? 'text-neutral-400 dark:text-neutral-500 line-through'
                          : isContribution
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isContribution ? `+ ${formatCurrency(entry.amount)}` : `- ${formatCurrency(entry.amount)}`}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-neutral-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                        {isVoided ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            Voided
                          </span>
                        ) : isTreasurerOrAdmin ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setVoidTarget(entry);
                              setVoidReason('');
                              setVoidError(null);
                            }}
                          >
                            Void
                          </Button>
                        ) : (
                          <span className="text-neutral-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Voiding Modal (Treasurer / Admin Only) */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0e0f0c] dark:text-[#f4f6f3]">
              Void Transaction Entry
            </h3>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
              Voiding marks this record as voided with an immutable audit trail and recalculates all fund balances. Entries are never hard-deleted.
            </div>

            <div className="p-3 rounded-xl bg-[#f0f3ee] dark:bg-[#181d18] border border-[#e0e4dd]/70 dark:border-[#1f261f] text-xs space-y-1">
              <div className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
                {voidTarget.purposeOrSource}
              </div>
              <div className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
                Amount: {formatCurrency(voidTarget.amount)} • Recorded by {voidTarget.recordedBy}
              </div>
            </div>

            {voidError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
                {voidError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                Reason for Voiding <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g. Duplicate entry recorded / incorrect amount entered..."
                className="w-full p-2.5 text-xs rounded-xl fikr-input font-medium"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setVoidTarget(null); setVoidReason(''); setVoidError(null); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={!voidReason.trim() || voiding}
                loading={voiding}
                onClick={handleConfirmVoid}
              >
                Confirm Void
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
