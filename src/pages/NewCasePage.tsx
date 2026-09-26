import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { CaseCategory } from '../types';
import { CASE_CATEGORIES } from '../lib/constants';

export const NewCasePage: React.FC = () => {
  const { addNewCase } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CaseCategory>('Medical');
  const [beneficiarySituation, setBeneficiarySituation] = useState('');
  const [helpRequired, setHelpRequired] = useState('');
  const [approxAmountRequested, setApproxAmountRequested] = useState<number | ''>('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationOfficer, setVerificationOfficer] = useState(currentUser?.name || '');
  const [publicPurposeSummary, setPublicPurposeSummary] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a brief case title.');
      return;
    }
    if (!beneficiarySituation.trim()) {
      setError('Please describe the beneficiary situation.');
      return;
    }
    if (!helpRequired.trim()) {
      setError('Please specify the exact help required.');
      return;
    }
    if (!approxAmountRequested || approxAmountRequested <= 0) {
      setError('Please enter a valid approximate amount requested.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const created = await addNewCase({
        title: title.trim(),
        category,
        reporterId: currentUser?.id || 'mem-1',
        reporterName: currentUser?.name || 'Core Member',
        beneficiarySituation: beneficiarySituation.trim(),
        helpRequired: helpRequired.trim(),
        approxAmountRequested: Number(approxAmountRequested),
        verificationNotes: verificationNotes.trim() || undefined,
        verificationOfficer: verificationOfficer.trim() || currentUser?.name,
        publicPurposeSummary: publicPurposeSummary.trim() || `${category} Assistance Support`,
        status: 'Reported'
      });

      navigate(`/cases/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/cases"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases List
      </Link>

      <div className="border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Intake & Report Community Case
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Submit verified ground information for core group review and collective decision.
        </p>
      </div>

      <PrivacyNotice />

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        {/* Reporter (Auto-assigned) */}
        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-500">Case Scout / Reporter: </span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {currentUser?.name || 'Current Core Member'}
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Auto-assigned from active session
          </span>
        </div>

        {/* Case Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Case Title / Overview <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Monthly Dialysis Injection Aid, School Textbook Support, Pushcart Axle Repair"
            className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
            required
          />
        </div>

        {/* Category & Amount Requested */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Assistance Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as CaseCategory)}
              className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {CASE_CATEGORIES.map((cat: CaseCategory) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Approximate Amount Requested (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={approxAmountRequested}
                onChange={e => setApproxAmountRequested(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 3500"
                className="w-full pl-8 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>
        </div>

        {/* Beneficiary Situation (Private to Core Members) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Beneficiary Background & Situation <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              🔒 Confidential (Core Members only)
            </span>
          </div>
          <textarea
            rows={3}
            value={beneficiarySituation}
            onChange={e => setBeneficiarySituation(e.target.value)}
            placeholder="Detail the family circumstances, breadwinner status, income vulnerability, and why assistance is needed."
            className="w-full p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
            required
          />
        </div>

        {/* Help Required / Action Plan */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Specific Help / Solution Required <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={helpRequired}
            onChange={e => setHelpRequired(e.target.value)}
            placeholder="e.g. Direct purchase of dialysis injections from pharmacy / Direct payment of school tuition slip / Handing over grocery ration pack."
            className="w-full p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
            required
          />
        </div>

        {/* Verification & Ground Inspection Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Ground Verification Notes & Evidence Summary
          </label>
          <textarea
            rows={2}
            value={verificationNotes}
            onChange={e => setVerificationNotes(e.target.value)}
            placeholder="e.g. Visited Samad's pharmacy; hospital discharge summary and prescriptions inspected. Direct doctor estimate verified."
            className="w-full p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
          />
        </div>

        {/* Sanitized Public Purpose Summary */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Sanitized Public Purpose Label (for public withdrawal ledger)
          </label>
          <input
            type="text"
            value={publicPurposeSummary}
            onChange={e => setPublicPurposeSummary(e.target.value)}
            placeholder="e.g. Vital dialysis & medical prescription assistance"
            className="w-full p-2.5 min-h-[44px] text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <p className="text-[11px] text-neutral-400">
            This high-level description will be safe for display on the public transparency ledger without exposing personal names.
          </p>
        </div>

        <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/cases')}
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
            Submit for Core Discussion
          </Button>
        </div>
      </form>
    </div>
  );
};
