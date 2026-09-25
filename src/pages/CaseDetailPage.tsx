import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageSquare,
  DollarSign,
  UserCheck,
  Send,
  Share2,
  HandCoins,
  Check
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CategoryBadge, RoleBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { formatCurrency, formatDate, formatShortDate, getRelativeTime, generateWhatsAppUrl } from '../lib/utils';
import { WHATSAPP_TEMPLATES } from '../lib/constants';
import { CaseComment, CaseAgreement, CaseDecision } from '../types';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCaseById, updateCase, agreeToCase, decideCase, addComment, getCommentsForCase } = useData();
  const { currentUser } = useAuth();

  const caseItem = id ? getCaseById(id) : undefined;

  const [comments, setComments] = useState<CaseComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Agreement form state
  const [agreeNote, setAgreeNote] = useState('');
  const [agreeAmount, setAgreeAmount] = useState<number | ''>('');
  const [submittingAgreement, setSubmittingAgreement] = useState(false);

  // Decision modal state (Treasurer & Coordinator)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decidedStatus, setDecidedStatus] = useState<'Approved' | 'Declined'>('Approved');
  const [decidedAmount, setDecidedAmount] = useState<number | ''>('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    if (caseItem) {
      getCommentsForCase(caseItem.id).then(setComments).catch(console.error);
      setDecidedAmount(caseItem.approvedAmount || caseItem.approxAmountRequested);
      setAgreeAmount(caseItem.approxAmountRequested);
    }
  }, [caseItem?.id]);

  if (!caseItem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Case Not Found</h2>
        <p className="text-xs text-neutral-500">The requested case record does not exist or has been removed.</p>
        <Link to="/cases">
          <Button variant="outline" size="sm">Back to Cases List</Button>
        </Link>
      </div>
    );
  }

  const isTreasurerOrCoordinator = currentUser?.isTreasurer || currentUser?.isCoordinator;
  const currentMemberAgreed = caseItem.agreements?.some((a: CaseAgreement) => a.memberId === currentUser?.id && a.agreed);

  const handleAgree = async () => {
    if (!currentUser) return;
    try {
      setSubmittingAgreement(true);
      const agreement: CaseAgreement = {
        memberId: currentUser.id,
        memberName: currentUser.name,
        agreed: true,
        suggestedAmount: agreeAmount ? Number(agreeAmount) : caseItem.approxAmountRequested,
        note: agreeNote.trim() || undefined,
        timestamp: new Date().toISOString()
      };
      await agreeToCase(caseItem.id, agreement);
      setAgreeNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAgreement(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    try {
      setSubmittingComment(true);
      const newC = await addComment({
        caseId: caseItem.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role as any,
        content: commentText.trim()
      });
      setComments((prev: CaseComment[]) => [...prev, newC]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSubmittingDecision(true);
      const decision: CaseDecision = {
        status: decidedStatus,
        approvedAmount: decidedStatus === 'Approved' ? Number(decidedAmount) : undefined,
        decidedBy: `${currentUser.name} (${currentUser.role})`,
        decidedAt: new Date().toISOString(),
        notes: decisionNotes.trim() || undefined
      };
      await decideCase(caseItem.id, decision);
      setDecisionModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleWhatsAppCaseShare = () => {
    const msg = WHATSAPP_TEMPLATES.caseDiscussion({
      caseNumber: caseItem.caseNumber,
      category: caseItem.category,
      helpRequired: caseItem.helpRequired,
      approxAmountRequested: caseItem.approxAmountRequested
    });
    window.open(generateWhatsAppUrl(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases List
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsAppCaseShare}
            icon={<Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          >
            Share to WhatsApp Group
          </Button>

          {caseItem.status === 'Approved' && (
            <Link to={`/withdrawals/new?caseId=${caseItem.id}`}>
              <Button
                variant="primary"
                size="sm"
                icon={<HandCoins className="w-3.5 h-3.5" />}
              >
                Release Approved Funds ({formatCurrency(caseItem.approvedAmount)})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <PrivacyNotice compact />

      {/* Main Case Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
        {/* Header Badges & Title */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                {caseItem.caseNumber}
              </span>
              <CategoryBadge category={caseItem.category} />
              <StatusBadge status={caseItem.status} />
            </div>

            <div className="text-xs text-neutral-400">
              Reported {formatDate(caseItem.createdAt)}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {caseItem.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Case Scout / Reporter: <strong>{caseItem.reporterName}</strong></span>
          </div>
        </div>

        {/* Amount Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[11px] uppercase font-semibold text-neutral-400">Approx Requested</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {formatCurrency(caseItem.approxAmountRequested)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[11px] uppercase font-semibold text-neutral-400">Group Decision</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {caseItem.approvedAmount ? formatCurrency(caseItem.approvedAmount) : 'Pending Decision'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800">
            <div className="text-[11px] uppercase font-semibold text-neutral-400">Fund Disbursement</div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {caseItem.releasedAmount ? formatCurrency(caseItem.releasedAmount) : 'Not Released Yet'}
            </div>
          </div>
        </div>

        {/* Beneficiary Background & Situation */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Beneficiary Situation & Circumstances
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-neutral-50/70 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
            {caseItem.beneficiarySituation}
          </p>
        </div>

        {/* Specific Solution / Help Required */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Specific Help / Intervention Required
          </h3>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-neutral-50/70 dark:bg-neutral-900/40 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
            {caseItem.helpRequired}
          </p>
        </div>

        {/* Verification & Ground Inspection Notes */}
        {caseItem.verificationNotes && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Ground Verification & Inspection
              </h3>
              {caseItem.verificationOfficer && (
                <span className="text-xs text-neutral-400">
                  Verified by: <strong>{caseItem.verificationOfficer}</strong>
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{caseItem.verificationNotes}</span>
            </div>
          </div>
        )}

        {/* Official Decision Outcome Banner */}
        {caseItem.decision && (
          <div className={`p-4 rounded-xl border ${
            caseItem.decision.status === 'Approved'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">
                Recorded Outcome: {caseItem.decision.status} {caseItem.decision.approvedAmount ? `(${formatCurrency(caseItem.decision.approvedAmount)})` : ''}
              </span>
              <span className="text-[11px] opacity-80">
                {formatShortDate(caseItem.decision.decidedAt)}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-1">
              {caseItem.decision.notes || 'Outcome confirmed by group consensus.'}
            </p>
            <div className="text-[11px] opacity-75 mt-2">
              Decided by {caseItem.decision.decidedBy}
            </div>
          </div>
        )}

        {/* Coordinator / Treasurer Decision Action Button */}
        {isTreasurerOrCoordinator && (
          <div className="pt-2 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModalOpen(true)}
            >
              {caseItem.decision ? 'Update Official Decision' : 'Record Official Decision'}
            </Button>
          </div>
        )}
      </div>

      {/* Lightweight Member Agreement / Voting Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Core Member Agreements ({caseItem.agreements?.length || 0})
            </h3>
            <p className="text-xs text-neutral-500">
              Each core member can signal concurrence and suggest budget adjustments.
            </p>
          </div>

          {currentMemberAgreed ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3.5 h-3.5" /> You have agreed
            </span>
          ) : null}
        </div>

        {/* Member Agreement Input Box */}
        {currentUser && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {currentMemberAgreed ? 'Update your agreement & suggested amount:' : 'Submit your agreement & suggested amount:'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-500">Suggested Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={agreeAmount}
                  onChange={e => setAgreeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 3500"
                  className="w-full p-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-neutral-500">Optional note / rationale</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agreeNote}
                    onChange={e => setAgreeNote(e.target.value)}
                    placeholder="e.g. Reviewed medicine bills. Fully agree to release."
                    className="flex-1 p-2 text-xs rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submittingAgreement}
                    onClick={handleAgree}
                  >
                    {currentMemberAgreed ? 'Update' : 'Agree'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agreement List */}
        {caseItem.agreements && caseItem.agreements.length > 0 ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {caseItem.agreements.map((a: CaseAgreement, idx: number) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-white">{a.memberName}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.2 rounded-md font-medium">
                      Agreed {a.suggestedAmount ? `(${formatCurrency(a.suggestedAmount)})` : ''}
                    </span>
                  </div>
                  {a.note && <p className="text-neutral-600 dark:text-neutral-400">{a.note}</p>}
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {getRelativeTime(a.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 text-center py-3">
            No member agreements recorded yet. Be the first to confirm concurrence!
          </p>
        )}
      </div>

      {/* Discussion & Comment Thread */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            Internal Discussion Thread ({comments.length})
          </h3>
          <p className="text-xs text-neutral-500">
            Record key ground insights, pharmacy discussions, and follow-ups.
          </p>
        </div>

        {/* Comments Feed */}
        <div className="space-y-3.5">
          {comments.map((c: CaseComment) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {c.authorName}
                  </span>
                  <RoleBadge role={c.authorRole} size="sm" />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {getRelativeTime(c.createdAt)}
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        {/* Comment input form */}
        <form onSubmit={handlePostComment} className="pt-2 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Add an update, invoice detail, or note..."
            className="flex-1 p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submittingComment}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Post
          </Button>
        </form>
      </div>

      {/* Official Decision Modal (Coordinator / Treasurer) */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Record Official Decision
              </h3>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Decision Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecidedStatus('Approved')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                      decidedStatus === 'Approved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Approve Case
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecidedStatus('Declined')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                      decidedStatus === 'Declined'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>

              {decidedStatus === 'Approved' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Final Approved Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={decidedAmount}
                    onChange={e => setDecidedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-bold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Decision Notes / Conditions
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  placeholder="e.g. Unanimously agreed after review. Payment to be made directly to school."
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submittingDecision}
                >
                  Save Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
