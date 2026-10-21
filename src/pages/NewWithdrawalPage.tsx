import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../lib/utils';
import { CaseCategory, CaseItem, Member } from '../types';
import { CASE_CATEGORIES } from '../lib/constants';

export const NewWithdrawalPage: React.FC = () => {
  const { members, cases, submitWithdrawal, fundStats } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedCaseId = searchParams.get('caseId');
  const matchedCase = preselectedCaseId ? cases.find((c: CaseItem) => c.id === preselectedCaseId) : undefined;

  const [selectedMemberName, setSelectedMemberName] = useState<string>(
    currentUser?.name || (members[0]?.name ?? '')
  );
  const [amount, setAmount] = useState<number | ''>(
    matchedCase?.approvedAmount || matchedCase?.approxAmountRequested || ''
  );
  const [remark, setRemark] = useState<string>(
    matchedCase ? `Assistance for ${matchedCase.caseNumber} (${matchedCase.category}): ${matchedCase.helpRequired}` : ''
  );
  const [category, setCategory] = useState<CaseCategory>(
    matchedCase?.category || 'Medical'
  );
  const [linkedCaseId, setLinkedCaseId] = useState<string>(preselectedCaseId || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active core members only for dropdown
  const activeMembers = members.filter((m: Member) => m.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberName) {
      setError('Please select the releasing member name.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Please enter a valid release amount.');
      return;
    }
    if (!remark.trim()) {
      setError('Please provide a remark / purpose.');
      return;
    }
    if (amount > fundStats.currentBalance) {
      if (!confirm(`Warning: The release amount (${formatCurrency(amount)}) exceeds the current available fund balance (${formatCurrency(fundStats.currentBalance)}). Proceed anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const targetCase = cases.find((c: CaseItem) => c.id === linkedCaseId);
      const selectedMem = members.find((m: Member) => m.name === selectedMemberName);

      await submitWithdrawal({
        amount: Number(amount),
        memberName: selectedMemberName,
        memberId: selectedMem?.id,
        remark: remark.trim(),
        purposeCategory: category,
        linkedCaseId: targetCase ? targetCase.id : undefined,
        linkedCaseNumber: targetCase ? targetCase.caseNumber : undefined,
        recordedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Treasurer'
      });

      navigate('/withdrawals');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/withdrawals"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Withdrawal Ledger
      </Link>

      <div className="border-b border-[#e0e4dd] dark:border-[#1f261f] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
          Record Fund Release / Withdrawal
        </h1>
        <p className="text-xs text-[#737672] dark:text-[#a3aba1] mt-1 font-normal">
          Server timestamp is captured automatically upon submission.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Balance Reminder */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/60 flex items-center justify-between text-xs shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <span className="text-emerald-800 dark:text-emerald-300 font-medium">
          Current Available Fund Balance:
        </span>
        <span className="text-lg font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
          {formatCurrency(fundStats.currentBalance)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-5">
        {/* Member Name Dropdown (Active Core Members) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
            Releasing / Disbursing Member Name <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedMemberName}
            onChange={e => setSelectedMemberName(e.target.value)}
            className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input font-medium"
            required
          >
            {activeMembers.map((m: Member) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
            Select the Core Member who is physically executing or handing over this release.
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
            Amount Released (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">₹</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 3500"
              className="w-full pl-8 pr-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl fikr-input"
              required
            />
          </div>
        </div>

        {/* Purpose Category */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
            Purpose Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as CaseCategory)}
            className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
          >
            {CASE_CATEGORIES.map((cat: CaseCategory) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Linked Case */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
            Link to Case (Optional)
          </label>
          <select
            value={linkedCaseId}
            onChange={e => {
              const cid = e.target.value;
              setLinkedCaseId(cid);
              const found = cases.find((c: CaseItem) => c.id === cid);
              if (found) {
                if (found.approvedAmount) setAmount(found.approvedAmount);
                setCategory(found.category);
              }
            }}
            className="w-full p-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
          >
            <option value="">No linked case / Direct emergency</option>
            {cases.map((c: CaseItem) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} — {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>

        {/* Remark / Purpose (Free text) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#454745] dark:text-[#a3aba1]">
            Remark & Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="e.g. Direct payment of medicines at pharmacy, hospital bill, school tuition voucher, or grocery ration kit."
            className="w-full p-3 text-xs rounded-xl fikr-input leading-relaxed"
            required
          />
          <p className="text-[11px] text-[#737672] dark:text-[#a3aba1]">
            Note: This remark will be visible on the public withdrawal ledger. Do not include personal beneficiary names.
          </p>
        </div>

        {/* Automatic Timestamp Info */}
        <div className="p-3 rounded-xl bg-[#e8ebe6]/60 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>Date and time will be recorded automatically upon submission.</span>
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/withdrawals')}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Record Withdrawal
          </Button>
        </div>
      </form>
    </div>
  );
};
