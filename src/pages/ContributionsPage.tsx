import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Plus,
  Calendar,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Users,
  HeartHandshake,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { RoleBadge, Badge } from '../components/common/Badge';
import { MemberRowSkeleton, Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatShortDate, formatDate } from '../lib/utils';
import { MIN_WEEKLY_CONTRIBUTION } from '../lib/constants';
import { getActiveMembers, getMemberAllTimeTotal } from '../lib/contributionUtils';
import { Member, Contribution } from '../types';

export const ContributionsPage: React.FC = () => {
  const { members, contributions, submitContribution, confirmContribution, importContributionsFromCSV, fundStats, loading, errors, timedOut } = useData();
  const { currentUser } = useAuth();

  const isTreasurerOrAdmin = Boolean(currentUser?.isTreasurer || currentUser?.isAdmin);

  // Available cycles
  const cycles = [
    { id: '2026-W38', label: 'Current Cycle (Sep 15 – Sep 21, 2026)' },
    { id: '2026-W37', label: 'Previous Cycle (Sep 08 – Sep 14, 2026)' },
    { id: '2026-W36', label: 'Cycle (Sep 01 – Sep 07, 2026)' },
    { id: '2026-W35', label: 'Cycle (Aug 25 – Aug 31, 2026)' },
    { id: 'historical', label: 'All Past & Historical Collections' },
  ];

  const [selectedCycle, setSelectedCycle] = useState<string>('2026-W38');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form state for recording contribution
  const [donorType, setDonorType] = useState<'member' | 'external'>('member');
  const [targetMemberId, setTargetMemberId] = useState<string>(members[0]?.id || '');
  const [externalDonorName, setExternalDonorName] = useState('');
  const [amount, setAmount] = useState<number | ''>(MIN_WEEKLY_CONTRIBUTION);
  const [contributionDate, setContributionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Contribution[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const activeMembers = useMemo(() => getActiveMembers(members), [members]);

  const cycleContributions = selectedCycle === 'historical'
    ? contributions
    : contributions.filter((c: Contribution) => c.weekCycle === selectedCycle);

  const totalCycleCollected = cycleContributions
    .filter((c: Contribution) => c.confirmedByTreasurer)
    .reduce((sum: number, c: Contribution) => sum + c.amount, 0);

  // Memoized client-side aggregation of all-time contributions per member (no N+1 Firestore queries)
  const memberTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const member of activeMembers) {
      totals[member.id] = getMemberAllTimeTotal(member, contributions);
    }
    return totals;
  }, [contributions, activeMembers]);

  const activeTarget = activeMembers.length * MIN_WEEKLY_CONTRIBUTION;
  const cycleLabel = cycles.find(c => c.id === selectedCycle)?.label || selectedCycle;

  // Record Contribution Submit Handler
  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    let contributorName = '';
    let memId: string | undefined = undefined;

    if (donorType === 'member') {
      const mem = members.find((m: Member) => m.id === targetMemberId);
      if (!mem) return;
      contributorName = mem.name;
      memId = mem.id;
    } else {
      if (!externalDonorName.trim()) return;
      contributorName = externalDonorName.trim();
    }

    try {
      setSubmitting(true);
      setRecordError(null);
      const paidTimestamp = new Date(contributionDate).toISOString();
      await submitContribution({
        memberId: memId,
        memberName: contributorName,
        isExternalDonor: donorType === 'external',
        weekCycle: selectedCycle === 'historical' ? 'Historical' : selectedCycle,
        cycleLabel: selectedCycle === 'historical' ? 'Special / Historical Contribution' : (cycleLabel.split('(')[1]?.replace(')', '') || cycleLabel),
        amount: Number(amount),
        paidAt: paidTimestamp,
        confirmedByTreasurer: isTreasurerOrAdmin,
        confirmedBy: isTreasurerOrAdmin ? currentUser?.name : undefined,
        confirmedAt: isTreasurerOrAdmin ? new Date().toISOString() : undefined,
        paymentMethod,
        notes: notes.trim() || (donorType === 'external' ? 'External Community Supporter' : undefined)
      });
      setRecordModalOpen(false);
      setExternalDonorName('');
      setNotes('');
      setDonorType('member');
    } catch (err: any) {
      console.error('Contribution submit error:', err);
      setRecordError(err.message || 'Failed to record contribution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickConfirm = async (cId: string) => {
    if (!currentUser) return;
    try {
      setActionError(null);
      await confirmContribution(cId, currentUser.name);
    } catch (err: any) {
      console.error('Confirm contribution error:', err);
      setActionError(err.message || 'Failed to confirm contribution.');
    }
  };

  // CSV Parsing Handler
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setImportError('The uploaded CSV file appears to be empty.');
          return;
        }

        // Expected header format: Date, Contributor Name, Amount, Payment Method, Cycle or Note, Is Member, Confirmed
        const parsed: Contribution[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // Handle standard comma split while preserving quoted text
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            const dateStr = cols[0] || new Date().toISOString().slice(0, 10);
            const name = cols[1] || 'Anonymous';
            const amt = parseFloat(cols[2].replace(/[^0-9.]/g, '')) || 100;
            const pMethod = cols[3] || 'UPI';
            const cycleOrNote = cols[4] || 'Historical Import';
            const isMemberVal = (cols[5] || '').toLowerCase().startsWith('y');
            const isConfirmedVal = (cols[6] || '').toLowerCase().startsWith('y') || cols[6] === undefined;

            const matchedMember = members.find(m => m.name.toLowerCase().trim() === name.toLowerCase().trim());

            parsed.push({
              id: `csv-import-${Date.now()}-${i}`,
              memberId: matchedMember ? matchedMember.id : undefined,
              memberName: matchedMember ? matchedMember.name : name,
              isExternalDonor: !matchedMember && !isMemberVal,
              weekCycle: 'Historical',
              cycleLabel: cycleOrNote,
              amount: amt,
              paidAt: new Date(dateStr).toISOString(),
              confirmedByTreasurer: isConfirmedVal,
              confirmedBy: isConfirmedVal ? (currentUser?.name || 'Treasurer (Bulk Import)') : undefined,
              confirmedAt: isConfirmedVal ? new Date().toISOString() : undefined,
              paymentMethod: pMethod,
              notes: `Bulk Imported: ${cycleOrNote}`
            });
          }
        }

        if (parsed.length === 0) {
          setImportError('No valid transaction rows found in CSV.');
        } else {
          setParsedRows(parsed);
        }
      } catch (err: any) {
        setImportError(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setImporting(true);
      setImportError(null);
      const res = await importContributionsFromCSV(parsedRows);
      setImportSuccess(`Successfully imported ${res.success} contributions into the fund records!`);
      setParsedRows([]);
      setCsvFile(null);
    } catch (err: any) {
      setImportError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e0e4dd] dark:border-[#1f261f] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Fund Inflow & Member Matrix</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
            Contributions & Collections
          </h1>
          <p className="text-sm text-[#454745] dark:text-[#a3aba1] mt-1 max-w-2xl font-normal">
            Track weekly core member commitments (₹100 minimum) as well as external supporter donations. Money transfers occur outside the app and are confirmed by the Treasurer.
          </p>
        </div>

        {isTreasurerOrAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setImportError(null);
                setImportSuccess(null);
                setParsedRows([]);
                setCsvModalOpen(true);
              }}
              icon={<Download className="w-4 h-4" />}
            >
              Import Historical CSV
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setRecordError(null);
                setRecordModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Record Contribution
            </Button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

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

      {/* Top Shared Summary Metric Cards (Derived from shared DataContext fundStats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#737672] dark:text-[#a3aba1] font-semibold uppercase tracking-wider">Total Fund Collected (All Time)</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
            {loading ? <Skeleton className="h-8 w-36 mt-1" /> : formatCurrency(fundStats.totalCollected)}
          </div>
          <div className="text-[11px] text-[#737672] dark:text-[#a3aba1] mt-0.5 font-normal">Verified received inflow matching ledger</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#737672] dark:text-[#a3aba1] font-semibold uppercase tracking-wider">Current Fund Balance</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0e0f0c] dark:text-[#f4f6f3] mt-1 tracking-tight">
            {loading ? <Skeleton className="h-8 w-36 mt-1" /> : formatCurrency(fundStats.currentBalance)}
          </div>
          <div className="text-[11px] text-[#737672] dark:text-[#a3aba1] mt-0.5 font-normal">Available for approved disbursements</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">{cycleLabel}</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1 tracking-tight">
            {loading ? (
              <Skeleton className="h-8 w-44 mt-1 bg-emerald-200/60 dark:bg-emerald-900/40" />
            ) : (
              <>
                {formatCurrency(totalCycleCollected)} <span className="text-xs font-normal text-emerald-600/80 dark:text-emerald-400">/ {formatCurrency(activeTarget)}</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-normal">
            {activeMembers.length} active members committed
          </div>
        </div>
      </div>

      {/* Cycle Selector & Cycle Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            className="text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] text-[#0e0f0c] dark:text-[#f4f6f3] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#737672] dark:text-[#a3aba1]">
          <span>Weekly Target: <strong className="text-[#0e0f0c] dark:text-[#f4f6f3]">{formatCurrency(activeTarget)}</strong></span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Cycle Collected: {formatCurrency(totalCycleCollected)}
          </span>
        </div>
      </div>

      {/* Member Matrix / Contribution Status */}
      <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#e0e4dd]/70 dark:border-[#1f261f] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3] flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Active Core Members ({activeMembers.length})</span>
          </h3>
          <span className="text-xs text-[#737672] dark:text-[#a3aba1]">
            Min Commitment: ₹{MIN_WEEKLY_CONTRIBUTION} / week
          </span>
        </div>

        <div className="divide-y divide-[#e0e4dd]/70 dark:divide-[#1f261f]">
          {loading ? (
            <>
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
              <MemberRowSkeleton />
            </>
          ) : activeMembers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Users className="w-6 h-6 text-emerald-600" />}
                title="No active core members"
                description="No active contributing members are listed in the roster."
              />
            </div>
          ) : (
            <>
              {cycleContributions.length === 0 && selectedCycle !== 'historical' && (
                <div className="p-4 sm:p-6 bg-[#f0f3ee]/40 dark:bg-[#181d18]/40 border-b border-[#e0e4dd]/70 dark:border-[#1f261f]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-[#454745] dark:text-[#a3aba1]">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No contributions recorded for this cycle yet. All {activeMembers.length} active members are currently due.</span>
                    </div>
                    {isTreasurerOrAdmin && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setRecordError(null);
                          setRecordModalOpen(true);
                        }}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Record Contribution
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {activeMembers.map((member: Member) => {
            const memberContrib = cycleContributions.find((c: Contribution) => c.memberId === member.id);
            const isPaid = memberContrib && memberContrib.confirmedByTreasurer;
            const isPending = memberContrib && !memberContrib.confirmedByTreasurer;

            return (
              <div
                key={member.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f0f3ee]/50 dark:hover:bg-[#181d18]/50 transition-colors"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {member.name}
                      </span>
                      <RoleBadge role={member.role} size="sm" />
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {member.notes || 'Core founding contributor'}
                    </div>
                  </div>
                </div>

                {/* Status & Amount */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 dark:border-neutral-800">
                  {isPaid ? (
                    <div className="text-right ml-auto sm:ml-0">
                      {isTreasurerOrAdmin && (
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal leading-tight mb-0.5">
                          Total: {formatCurrency(memberTotals[member.id] || 0)}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid {formatCurrency(memberContrib.amount)}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Via {memberContrib.paymentMethod || 'UPI'} • {formatShortDate(memberContrib.paidAt)}
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <div className="text-right">
                        {isTreasurerOrAdmin && (
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal leading-tight mb-0.5">
                            Total: {formatCurrency(memberTotals[member.id] || 0)}
                          </div>
                        )}
                        <div className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                          Pending Approval ({formatCurrency(memberContrib.amount)})
                        </div>
                        <div className="text-[10px] text-neutral-400">Awaiting Treasurer</div>
                      </div>
                      {isTreasurerOrAdmin && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuickConfirm(memberContrib.id)}
                        >
                          Confirm
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <div className="text-right">
                        {isTreasurerOrAdmin && (
                          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal leading-tight mb-0.5">
                            Total: {formatCurrency(memberTotals[member.id] || 0)}
                          </div>
                        )}
                        <span className="text-[11px] text-neutral-400 font-medium">
                          Due (₹{MIN_WEEKLY_CONTRIBUTION})
                        </span>
                      </div>
                      {isTreasurerOrAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDonorType('member');
                            setTargetMemberId(member.id);
                            setRecordModalOpen(true);
                          }}
                        >
                          Record
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
            </>
          )}
        </div>
      </div>

      {/* External Supporter & Non-Member Donations (Treasurer/Admin View) */}
      {cycleContributions.some(c => c.isExternalDonor) && isTreasurerOrAdmin && (
        <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl overflow-hidden shadow-xs space-y-2">
          <div className="p-4 sm:p-5 border-b border-[#e0e4dd]/70 dark:border-[#1f261f] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0e0f0c] dark:text-[#f4f6f3] flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-sky-600" />
              <span>External Supporter & Donor Contributions (Confidential)</span>
            </h3>
            <span className="text-xs text-[#737672] dark:text-[#a3aba1]">
              Visible to Treasurer & Admin only
            </span>
          </div>

          <div className="divide-y divide-[#e0e4dd]/70 dark:divide-[#1f261f]">
            {cycleContributions.filter(c => c.isExternalDonor).map(c => (
              <div key={c.id} className="p-4 sm:px-6 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">{c.memberName}</div>
                  <div className="text-[11px] text-[#737672] dark:text-[#a3aba1]">{c.notes || 'External Supporter'} • {formatShortDate(c.paidAt)}</div>
                </div>
                <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  + {formatCurrency(c.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Contribution Modal (Treasurer / Admin Only) */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0e0f0c] dark:text-[#f4f6f3]">
                Record Contribution
              </h3>
              <button
                onClick={() => setRecordModalOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {recordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recordError}</span>
              </div>
            )}

            <form onSubmit={handleRecordContribution} className="space-y-4">
              {/* Contributor Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                  Contributor Type
                </label>
                <div className="flex rounded-full bg-[#e8ebe6] dark:bg-[#181d18] p-1">
                  <button
                    type="button"
                    onClick={() => setDonorType('member')}
                    className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                      donorType === 'member'
                        ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                        : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
                    }`}
                  >
                    Core Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorType('external')}
                    className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
                      donorType === 'external'
                        ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                        : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
                    }`}
                  >
                    External Donor / Supporter
                  </button>
                </div>
              </div>

              {/* Name Picker (Dropdown or Text Input) */}
              {donorType === 'member' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                    Select Core Member
                  </label>
                  <select
                    value={targetMemberId}
                    onChange={e => setTargetMemberId(e.target.value)}
                    className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input font-medium"
                    required
                  >
                    {activeMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                    Donor / Well-Wisher Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={externalDonorName}
                    onChange={e => setExternalDonorName(e.target.value)}
                    placeholder="e.g. Tariq Ahmad / Well-wisher"
                    className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input font-medium"
                    required
                  />
                  <p className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
                    External donor personal names are kept confidential to the Treasurer & Admin.
                  </p>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 min-h-[44px] text-xs font-bold rounded-xl fikr-input"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                    Received Date
                  </label>
                  <input
                    type="date"
                    value={contributionDate}
                    onChange={e => setContributionDate(e.target.value)}
                    className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
                    required
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as 'UPI' | 'Cash' | 'Bank Transfer')}
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
                >
                  <option value="UPI">UPI Transfer</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
                  Optional Note / Transaction Reference
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Received via GPay / August special contribution"
                  className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                >
                  Record Contribution
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#0e0f0c] dark:text-[#f4f6f3]">
                  Bulk Import Historical Contributions
                </h3>
              </div>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#737672] dark:text-[#a3aba1] leading-relaxed">
              Upload a `.csv` file exported from Excel to import previously collected fund records in bulk.
            </p>

            {/* Template Download Box */}
            <div className="p-4 rounded-2xl bg-[#e8ebe6]/60 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">Download CSV / Excel Format Template</div>
                <div className="text-[11px] text-[#737672] dark:text-[#a3aba1]">Pre-formatted columns for error-free import</div>
              </div>
              <a
                href="/fikr_historical_contributions_template.csv"
                download="fikr_historical_contributions_template.csv"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline w-fit shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </a>
            </div>

            {importError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {/* File Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Choose CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="w-full text-xs p-2.5 min-h-[44px] rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
              />
            </div>

            {/* Preview of Parsed Rows */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Parsed Transactions Preview ({parsedRows.length} rows):
                  </span>
                  <span className="font-bold text-emerald-600">
                    Total: {formatCurrency(parsedRows.reduce((s, r) => s + r.amount, 0))}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200/80 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                  {parsedRows.slice(0, 10).map((row, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-white">{row.memberName}</div>
                        <div className="text-[10px] text-neutral-400">{formatShortDate(row.paidAt)} • {row.paymentMethod} • {row.cycleLabel}</div>
                      </div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(row.amount)}
                      </div>
                    </div>
                  ))}
                  {parsedRows.length > 10 && (
                    <div className="p-2 text-center text-[11px] text-neutral-400">
                      + {parsedRows.length - 10} more rows ready to import
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCsvModalOpen(false)}
              >
                Close
              </Button>
              {parsedRows.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={importing}
                  onClick={handleExecuteImport}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Confirm Import ({parsedRows.length} entries)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
