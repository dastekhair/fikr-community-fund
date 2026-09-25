import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Plus,
  Calendar,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { RoleBadge } from '../components/common/Badge';
import { formatCurrency, formatShortDate } from '../lib/utils';
import { MIN_WEEKLY_CONTRIBUTION } from '../lib/constants';
import { Member, Contribution } from '../types';

export const ContributionsPage: React.FC = () => {
  const { members, contributions, submitContribution, confirmContribution } = useData();
  const { currentUser } = useAuth();

  const isTreasurer = currentUser?.isTreasurer || currentUser?.role === 'Treasurer';

  // Available cycles
  const cycles = [
    { id: '2026-W38', label: 'Current Cycle (Sep 15 – Sep 21, 2026)' },
    { id: '2026-W37', label: 'Previous Cycle (Sep 08 – Sep 14, 2026)' },
    { id: '2026-W36', label: 'Cycle (Sep 01 – Sep 07, 2026)' },
    { id: '2026-W35', label: 'Cycle (Aug 25 – Aug 31, 2026)' },
  ];

  const [selectedCycle, setSelectedCycle] = useState<string>('2026-W38');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state for recording manual contribution
  const [targetMemberId, setTargetMemberId] = useState<string>(members[0]?.id || '');
  const [amount, setAmount] = useState<number | ''>(MIN_WEEKLY_CONTRIBUTION);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash'>('UPI');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeMembers = members.filter((m: Member) => m.isActive);
  const cycleContributions = contributions.filter((c: Contribution) => c.weekCycle === selectedCycle);

  const totalCycleCollected = cycleContributions
    .filter((c: Contribution) => c.confirmedByTreasurer)
    .reduce((sum: number, c: Contribution) => sum + c.amount, 0);

  const activeTarget = activeMembers.length * MIN_WEEKLY_CONTRIBUTION;
  const cycleLabel = cycles.find(c => c.id === selectedCycle)?.label || selectedCycle;

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m: Member) => m.id === targetMemberId);
    if (!mem || !amount || amount <= 0) return;

    try {
      setSubmitting(true);
      await submitContribution({
        memberId: mem.id,
        memberName: mem.name,
        weekCycle: selectedCycle,
        cycleLabel: cycleLabel.split('(')[1]?.replace(')', '') || cycleLabel,
        amount: Number(amount),
        paidAt: new Date().toISOString(),
        confirmedByTreasurer: Boolean(isTreasurer),
        confirmedBy: isTreasurer ? currentUser?.name : undefined,
        confirmedAt: isTreasurer ? new Date().toISOString() : undefined,
        paymentMethod,
        notes: notes.trim() || undefined
      });
      setModalOpen(false);
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickConfirm = async (cId: string) => {
    if (!currentUser) return;
    await confirmContribution(cId, currentUser.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Core Member Weekly Pool</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Weekly Contribution Tracker
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Each core member commits to a minimum of ₹100 weekly. Real money moves directly via external UPI/cash and is confirmed here by the Treasurer.
          </p>
        </div>

        {isTreasurer && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Member Contribution
          </Button>
        )}
      </div>

      {/* Cycle Selector & Cycle Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-400" />
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(e.target.value)}
            className="text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span>Weekly Target: <strong>{formatCurrency(activeTarget)}</strong></span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Collected: {formatCurrency(totalCycleCollected)}
          </span>
        </div>
      </div>

      {/* Member Matrix / Contribution Status */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Active Core Members ({activeMembers.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Min Requirement: ₹{MIN_WEEKLY_CONTRIBUTION} / week
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {activeMembers.map((member: Member) => {
            const memberContrib = cycleContributions.find((c: Contribution) => c.memberId === member.id);
            const isPaid = memberContrib && memberContrib.confirmedByTreasurer;
            const isPending = memberContrib && !memberContrib.confirmedByTreasurer;

            return (
              <div
                key={member.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
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
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid {formatCurrency(memberContrib.amount)}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Via {memberContrib.paymentMethod || 'UPI'} • {formatShortDate(memberContrib.paidAt)}
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                          Pending Approval ({formatCurrency(memberContrib.amount)})
                        </div>
                        <div className="text-[10px] text-neutral-400">Awaiting Treasurer</div>
                      </div>
                      {isTreasurer && (
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
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-medium">
                        Due (₹{MIN_WEEKLY_CONTRIBUTION})
                      </span>
                      {isTreasurer && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTargetMemberId(member.id);
                            setModalOpen(true);
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
        </div>
      </div>

      {/* Manual Contribution Entry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Record Member Contribution
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordContribution} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Core Member
                </label>
                <select
                  value={targetMemberId}
                  onChange={e => setTargetMemberId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  required
                >
                  {activeMembers.map((m: Member) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-bold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as 'UPI' | 'Cash')}
                    className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Cash">Cash in Hand</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Optional Note / Reference
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Received via GPay from Rizwan"
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                >
                  Record & Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
