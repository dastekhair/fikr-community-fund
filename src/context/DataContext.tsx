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
  subscribeToCaseComments,
  fetchCaseComments,
  addCaseCommentDoc,
  addWithdrawalDoc,
  voidWithdrawalDoc,
  saveContributionDoc,
  confirmContributionDoc,
  voidContributionDoc,
  importContributionsBatch,
  formatFirestoreError
} from '../lib/firestore';
import { buildLedgerFromData } from '../lib/mockData';
import { MIN_WEEKLY_CONTRIBUTION } from '../lib/constants';
import { CURRENT_CYCLE, isContributionInCycle } from '../lib/contributionUtils';

interface DataContextType {
  members: Member[];
  cases: CaseItem[];
  withdrawals: Withdrawal[];
  contributions: Contribution[];
  ledger: LedgerEntry[];
  fundStats: FundStats;
  loading: boolean;
  loaded: {
    members: boolean;
    cases: boolean;
    withdrawals: boolean;
    contributions: boolean;
  };
  errors: {
    members?: string | null;
    cases?: string | null;
    withdrawals?: string | null;
    contributions?: string | null;
  };
  timedOut: boolean;
  getCaseById: (id: string) => CaseItem | undefined;
  getCommentsForCase: (caseId: string) => Promise<CaseComment[]>;
  subscribeCaseComments: (caseId: string, callback: (comments: CaseComment[]) => void) => () => void;
  addNewCase: (caseData: Omit<CaseItem, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt'>) => Promise<CaseItem>;
  updateCase: (caseId: string, updates: Partial<CaseItem>) => Promise<void>;
  agreeToCase: (caseId: string, agreement: CaseAgreement) => Promise<void>;
  decideCase: (caseId: string, decision: CaseDecision) => Promise<void>;
  addComment: (comment: Omit<CaseComment, 'id' | 'createdAt'>) => Promise<CaseComment>;
  submitWithdrawal: (wData: Omit<Withdrawal, 'id' | 'timestamp'>) => Promise<Withdrawal>;
  voidWithdrawal: (withdrawalId: string, voidedByName: string, reason: string) => Promise<void>;
  submitContribution: (contribData: Omit<Contribution, 'id'>) => Promise<Contribution>;
  voidContribution: (contributionId: string, voidedByName: string, reason: string) => Promise<void>;
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
  const [loaded, setLoaded] = useState({
    members: false,
    cases: false,
    withdrawals: false,
    contributions: false
  });
  const [errors, setErrors] = useState<{
    members?: string | null;
    cases?: string | null;
    withdrawals?: string | null;
    contributions?: string | null;
  }>({});
  const [timedOut, setTimedOut] = useState<boolean>(false);

  // Realtime subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    // Timeout fallback after ~10 seconds
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
    }, 10000);

    const unsubM = subscribeToMembers(
      (data) => {
        setMembers(data);
        setLoaded(prev => ({ ...prev, members: true }));
      },
      (err) => {
        setErrors(prev => ({ ...prev, members: formatFirestoreError(err) }));
      }
    );

    const unsubC = subscribeToCases(
      (data) => {
        setCases(data);
        setLoaded(prev => ({ ...prev, cases: true }));
      },
      (err) => {
        // If unauthenticated visitor, this is expected security denial; otherwise store formatted error
        if (err?.code !== 'permission-denied') {
          setErrors(prev => ({ ...prev, cases: formatFirestoreError(err) }));
        }
        setLoaded(prev => ({ ...prev, cases: true }));
      }
    );

    const unsubW = subscribeToWithdrawals(
      (data) => {
        setWithdrawals(data);
        setLoaded(prev => ({ ...prev, withdrawals: true }));
      },
      (err) => {
        setErrors(prev => ({ ...prev, withdrawals: formatFirestoreError(err) }));
      }
    );

    const unsubCo = subscribeToContributions(
      (data) => {
        setContributions(data);
        setLoaded(prev => ({ ...prev, contributions: true }));
      },
      (err) => {
        setErrors(prev => ({ ...prev, contributions: formatFirestoreError(err) }));
      }
    );

    unsubs = [unsubM, unsubC, unsubW, unsubCo];
    return () => {
      clearTimeout(timeoutTimer);
      unsubs.forEach(u => u());
    };
  }, []);

  const loading = !loaded.contributions || !loaded.withdrawals || !loaded.members;

  // Compute Auto-Calculated Ledger
  const ledger = useMemo(() => {
    return buildLedgerFromData(contributions, withdrawals);
  }, [contributions, withdrawals]);

  // Compute Live Fund Stats (strictly excluding voided documents)
  const fundStats: FundStats = useMemo(() => {
    const totalCollected = contributions
      .filter(c => c.status !== 'voided' && c.confirmedByTreasurer)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalReleased = withdrawals
      .filter(w => w.status !== 'voided')
      .reduce((sum, w) => sum + w.amount, 0);

    const currentBalance = totalCollected - totalReleased;

    const casesHelped = cases.filter(c => c.status === 'Released' || (c.status === 'Closed' && (c.releasedAmount || 0) > 0)).length;

    const activeMembersCount = members.filter(m => m.isActive).length;

    // Current week or latest Friday cycle contributions (excluding voided)
    const currentWeeklyCollected = contributions
      .filter(c => c.status !== 'voided' && c.confirmedByTreasurer && isContributionInCycle(c, CURRENT_CYCLE))
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

  const subscribeCaseComments = (caseId: string, callback: (comments: CaseComment[]) => void) => {
    return subscribeToCaseComments(caseId, callback);
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

  const voidWithdrawal = async (withdrawalId: string, voidedByName: string, reason: string): Promise<void> => {
    await voidWithdrawalDoc(withdrawalId, voidedByName, reason);
  };

  const submitContribution = async (contribData: Omit<Contribution, 'id'>): Promise<Contribution> => {
    const newContrib: Contribution = {
      ...contribData,
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    await saveContributionDoc(newContrib);
    return newContrib;
  };

  const voidContribution = async (contributionId: string, voidedByName: string, reason: string): Promise<void> => {
    await voidContributionDoc(contributionId, voidedByName, reason);
  };

  const confirmContribution = async (contribId: string, treasurerName: string): Promise<void> => {
    await confirmContributionDoc(contribId, treasurerName);
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
        loaded,
        errors,
        timedOut,
        getCaseById,
        getCommentsForCase,
        subscribeCaseComments,
        addNewCase,
        updateCase,
        agreeToCase,
        decideCase,
        addComment,
        submitWithdrawal,
        voidWithdrawal,
        submitContribution,
        voidContribution,
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
