import { CaseItem, Withdrawal, Contribution, LedgerEntry, CaseComment } from '../types';

// Clean initial production state: 0 fake cases, 0 fake withdrawals, 0 fake contributions
export const INITIAL_CASES: CaseItem[] = [];

export const INITIAL_COMMENTS: CaseComment[] = [];

export const INITIAL_WITHDRAWALS: Withdrawal[] = [];

export const INITIAL_CONTRIBUTIONS: Contribution[] = [];

export function buildLedgerFromData(contributions: Contribution[], withdrawals: Withdrawal[]): LedgerEntry[] {
  const events: {
    id: string;
    timestamp: string;
    type: 'contribution' | 'withdrawal';
    amount: number;
    purposeOrSource: string;
    caseReference?: string;
    recordedBy: string;
    rawCategory?: any;
  }[] = [];

  for (const c of contributions) {
    if (c.confirmedByTreasurer) {
      events.push({
        id: `ledg-c-${c.id}`,
        timestamp: c.paidAt || new Date().toISOString(),
        type: 'contribution',
        amount: c.amount,
        purposeOrSource: `Weekly contribution (${c.memberName}) - ${c.cycleLabel}`,
        recordedBy: c.confirmedBy || 'Treasurer'
      });
    }
  }

  for (const w of withdrawals) {
    events.push({
      id: `ledg-w-${w.id}`,
      timestamp: w.timestamp,
      type: 'withdrawal',
      amount: w.amount,
      purposeOrSource: `Assistance released (${w.memberName}) — ${w.remark}`,
      caseReference: w.linkedCaseNumber || undefined,
      recordedBy: w.recordedBy,
      rawCategory: w.purposeCategory
    });
  }

  // Sort ascending by timestamp to calculate accurate running balance
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let running = 0;
  const ledger: LedgerEntry[] = events.map(e => {
    if (e.type === 'contribution') {
      running += e.amount;
    } else {
      running -= e.amount;
    }
    return {
      ...e,
      runningBalance: running
    };
  });

  // Return descending (newest first) for viewing
  return ledger.reverse();
}
