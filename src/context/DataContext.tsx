import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Member,
  CaseItem,
  CaseComment,
  Withdrawal,
  Contribution,
  LedgerEntry,
  FundStats,
  CaseAgreement,
  CaseDecision
} from '../types';
import {
  subscribeToMembers,
  subscribeToCases,
  subscribeToWithdrawals,
  subscribeToContributions,
  addMemberDoc,
  updateMemberDoc,
  addCaseDoc,
  updateCaseDoc,
  fetchCaseComments,
  addCaseCommentDoc,
  addWithdrawalDoc,
  saveContributionDoc,
  importContributionsBatch
} from '../lib/firestore';
import { buildLedgerFromData } from '../lib/mockData';
import { MIN_WEEKLY_CONTRIBUTION } from '../lib/constants';

interface DataContextType {
  members: Member[];
  cases: CaseItem[];
  withdrawals: Withdrawal[];
  contributions: Contribution[];
  ledger: LedgerEntry[];
  fundStats: FundStats;
  loading: boolean;
  getCaseById: (id: string) => CaseItem | undefined;
  getCommentsForCase: (caseId: string) => Promise<CaseComment[]>;
  addNewCase: (caseData: Omit<CaseItem, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>) => Promise<CaseItem>;
  updateCase: (caseId: string, updates: Partial<CaseItem>) => Promise<void>;
  agreeToCase: (caseId: string, agreement: CaseAgreement) => Promise<void>;
  decideCase: (caseId: string, decision: CaseDecision) => Promise<void>;
  addComment: (comment: Omit<CaseComment, 'id' | 'createdAt'>) => Promise<CaseComment>;
  submitWithdrawal: (wData: Omit<Withdrawal, 'id' | 'timestamp'>) => Promise<Withdrawal>;
  submitContribution: (contribData: Omit<Contribution, 'id'>) => Promise<void>;
  confirmContribution: (contribId: string, treasurerName: string) => Promise<void>;
  importContributionsFromCSV: (data: Contribution[]) => Promise<{ success: number; failed: number }>;
  addNewMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  toggleMemberActive: (id: string, currentStatus: boolean) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Realtime subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubM = subscribeToMembers((data) => setMembers(data));
    const unsubC = subscribeToCases((data) => setCases(data));
    const unsubW = subscribeToWithdrawals((data) => setWithdrawals(data));
    const unsubCo = subscribeToContributions((data) => {
      setContributions(data);
      setLoading(false);
    });

    unsubs = [unsubM, unsubC, unsubW, unsubCo];
    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // Compute Auto-Calculated Ledger
  const ledger = useMemo(() => {
    return buildLedgerFromData(contributions, withdrawals);
  }, [contributions, withdrawals]);

  // Compute Live Fund Stats
  const fundStats: FundStats = useMemo(() => {
    const totalCollected = contributions
      .filter(c => c.confirmedByTreasurer)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalReleased = withdrawals
      .reduce((sum, w) => sum + w.amount, 0);

    const currentBalance = totalCollected - totalReleased;

    const casesHelped = cases.filter(c => c.status === 'Released' || (c.status === 'Closed' && (c.releasedAmount || 0) > 0)).length;

    const activeMembersCount = members.filter(m => m.isActive).length;

    // Current week or latest cycle contributions
    const currentWeeklyCollected = contributions
      .filter(c => c.weekCycle === '2026-W38' && c.confirmedByTreasurer)
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      totalCollected,
      totalReleased,
      currentBalance,
      casesHelped,
      activeContributors: activeMembersCount,
      weeklyTarget: activeMembersCount * MIN_WEEKLY_CONTRIBUTION,
      currentWeeklyCollected
    };
  }, [contributions, withdrawals, cases, members]);

  const getCaseById = (id: string) => {
    return cases.find(c => c.id === id || c.caseNumber.toLowerCase() === id.toLowerCase());
  };

  const getCommentsForCase = async (caseId: string): Promise<CaseComment[]> => {
    return await fetchCaseComments(caseId);
  };

  const addNewCase = async (caseData: Omit<CaseItem, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>): Promise<CaseItem> => {
    const created = await addCaseDoc(caseData);
    return created;
  };

  const updateCase = async (caseId: string, updates: Partial<CaseItem>): Promise<void> => {
    await updateCaseDoc(caseId, updates);
  };

  const agreeToCase = async (caseId: string, agreement: CaseAgreement): Promise<void> => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    const existingAgreements = targetCase.agreements || [];
    const filtered = existingAgreements.filter(a => a.memberId !== agreement.memberId);
    const updatedAgreements = [...filtered, agreement];

    await updateCase(caseId, {
      agreements: updatedAgreements,
      status: targetCase.status === 'Reported' ? 'Under Discussion' : targetCase.status
    });
  };

  const decideCase = async (caseId: string, decision: CaseDecision): Promise<void> => {
    await updateCase(caseId, {
      decision,
      status: decision.status === 'Approved' ? 'Approved' : 'Declined',
      approvedAmount: decision.approvedAmount
    });
  };

  const addComment = async (commentData: Omit<CaseComment, 'id' | 'createdAt'>): Promise<CaseComment> => {
    const created = await addCaseCommentDoc(commentData);
    return created;
  };

  const submitWithdrawal = async (wData: Omit<Withdrawal, 'id' | 'timestamp'>): Promise<Withdrawal> => {
    const created = await addWithdrawalDoc(wData);
    if (wData.linkedCaseId) {
      await updateCase(wData.linkedCaseId, {
        status: 'Released',
        releasedAmount: wData.amount
      });
    }
    return created;
  };

  const submitContribution = async (contribData: Omit<Contribution, 'id'>): Promise<void> => {
    const newContrib: Contribution = {
      ...contribData,
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    await saveContributionDoc(newContrib);
  };

  const confirmContribution = async (contribId: string, treasurerName: string): Promise<void> => {
    const target = contributions.find(c => c.id === contribId);
    if (!target) return;

    const updated: Contribution = {
      ...target,
      confirmedByTreasurer: true,
      confirmedBy: treasurerName,
      confirmedAt: new Date().toISOString()
    };
    await saveContributionDoc(updated);
  };

  const importContributionsFromCSV = async (data: Contribution[]): Promise<{ success: number; failed: number }> => {
    return await importContributionsBatch(data);
  };

  const addNewMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
    const created = await addMemberDoc(memberData);
    return created;
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    await updateMemberDoc(id, updates);
  };

  const toggleMemberActive = async (id: string, currentStatus: boolean): Promise<void> => {
    await updateMember(id, { isActive: !currentStatus });
  };

  return (
    <DataContext.Provider
      value={{
        members,
        cases,
        withdrawals,
        contributions,
        ledger,
        fundStats,
        loading,
        getCaseById,
        getCommentsForCase,
        addNewCase,
        updateCase,
        agreeToCase,
        decideCase,
        addComment,
        submitWithdrawal,
        submitContribution,
        confirmContribution,
        importContributionsFromCSV,
        addNewMember,
        updateMember,
        toggleMemberActive
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
