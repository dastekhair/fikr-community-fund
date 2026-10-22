import { Contribution, Member } from '../types';
import { MIN_WEEKLY_CONTRIBUTION } from './constants';

export interface FridayCycle {
  id: string; // e.g. "2026-10-16"
  label: string; // e.g. "Current Cycle (16 Oct – 22 Oct 2026)"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent?: boolean;
}

/**
 * Returns the Friday that started the weekly cycle for any given reference date.
 * If the reference date is Friday, it returns that Friday (at 00:00:00).
 * If Saturday through Thursday, it returns the preceding Friday.
 */
export function getFridayForDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const diffToFriday = (day + 2) % 7;
  const friday = new Date(d);
  friday.setDate(d.getDate() - diffToFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

export function getFridayCycleKey(friday: Date): string {
  const y = friday.getFullYear();
  const m = String(friday.getMonth() + 1).padStart(2, '0');
  const d = String(friday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatCycleLabel(friday: Date, isCurrent: boolean, isPrevious: boolean): string {
  const thDate = new Date(friday);
  thDate.setDate(thDate.getDate() + 6);

  const fStr = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(friday);
  const thStr = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(thDate);

  const prefix = isCurrent ? 'Current Cycle' : isPrevious ? 'Previous Cycle' : 'Cycle';
  return `${prefix} (${fStr} – ${thStr})`;
}

/**
 * Generate Friday-anchored weekly cycles dynamically.
 * Cycles run Friday through Thursday because the Treasurer asks for contributions on Fridays.
 */
export function getFridayCycles(referenceDate: Date = new Date(), count: number = 6): FridayCycle[] {
  const currentFriday = getFridayForDate(referenceDate);
  const list: FridayCycle[] = [];

  for (let i = 0; i < count; i++) {
    const fDate = new Date(currentFriday);
    fDate.setDate(fDate.getDate() - (i * 7));

    const thDate = new Date(fDate);
    thDate.setDate(thDate.getDate() + 6);

    const id = getFridayCycleKey(fDate);
    const label = formatCycleLabel(fDate, i === 0, i === 1);

    list.push({
      id,
      label,
      startDate: getFridayCycleKey(fDate),
      endDate: getFridayCycleKey(thDate),
      isCurrent: i === 0
    });
  }

  // Add historical bucket
  list.push({
    id: 'historical',
    label: 'All Past & Historical Collections',
    startDate: '1970-01-01',
    endDate: '2099-12-31'
  });

  return list;
}

// Current Friday cycle
export const CURRENT_FRIDAY = getFridayForDate();
export const CURRENT_CYCLE_ID = getFridayCycleKey(CURRENT_FRIDAY);
export const CURRENT_CYCLE_LABEL = formatCycleLabel(CURRENT_FRIDAY, true, false);
export const CURRENT_CYCLE: FridayCycle = {
  id: CURRENT_CYCLE_ID,
  label: CURRENT_CYCLE_LABEL,
  startDate: CURRENT_CYCLE_ID,
  endDate: getFridayCycleKey(new Date(CURRENT_FRIDAY.getTime() + 6 * 86400000)),
  isCurrent: true
};

export function getCycleById(cycleId: string, referenceDate: Date = new Date()): FridayCycle | undefined {
  const cycles = getFridayCycles(referenceDate, 12);
  return cycles.find(c => c.id === cycleId);
}

/**
 * Check if a contribution belongs to a specific cycle.
 * Matches by cycle ID, date-range partition (Friday to Thursday), or historical fallback.
 */
export function isContributionInCycle(c: Contribution, cycle: FridayCycle): boolean {
  if (c.status === 'voided') return false;
  if (cycle.id === 'historical') return true;

  // Direct match by cycle id (e.g. "2026-10-16")
  if (c.weekCycle === cycle.id) return true;

  // Date range match based on paidAt (Friday 00:00:00 to Thursday 23:59:59)
  if (c.paidAt) {
    const paidDate = c.paidAt.slice(0, 10);
    return paidDate >= cycle.startDate && paidDate <= cycle.endDate;
  }

  // Backward compatibility fallback for legacy weekCycle === '2026-W38' ONLY IF paidAt is missing
  if (!c.paidAt && c.weekCycle === '2026-W38' && (cycle.isCurrent || cycle.id === CURRENT_CYCLE_ID)) {
    return true;
  }

  return false;
}

/**
 * Filter only active members, excluding migrated legacy records.
 * Missing optional fields are treated as active/normal.
 */
export function getActiveMembers(members: Member[]): Member[] {
  return members.filter((m) => m.isActive && !m.migrated);
}

/**
 * Match a contribution to a member record using ID, UID, legacyId, migratedTo,
 * or normalized/tokenized name matching.
 */
export function isContributionForMember(c: Contribution, member: Member): boolean {
  if (c.status === 'voided') return false;
  if (c.isExternalDonor) return false;

  // Match by member ID (direct UID, legacy ID, or migrated ID)
  if (c.memberId) {
    if (
      c.memberId === member.id ||
      (member.uid && c.memberId === member.uid) ||
      (member.legacyId && c.memberId === member.legacyId) ||
      (member.migratedTo && c.memberId === member.migratedTo)
    ) {
      return true;
    }
  }

  // Match by member name (matches exact name or tokenized short name)
  if (c.memberName) {
    const cName = c.memberName.trim().toLowerCase();
    const mName = member.name.trim().toLowerCase();
    if (cName === mName) return true;
    const mTokens = mName.split(/\s+/);
    if (mTokens.includes(cName)) return true;
  }

  return false;
}

/**
 * Calculate all-time contributed amount for a member across all cycles and sources.
 */
export function getMemberAllTimeTotal(member: Member, contributions: Contribution[]): number {
  return contributions
    .filter((c) => isContributionForMember(c, member))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
}

/**
 * Get the most recent contribution record for a member.
 */
export function getMemberLastContribution(member: Member, contributions: Contribution[]): Contribution | null {
  const memberContribs = contributions
    .filter((c) => isContributionForMember(c, member))
    .sort((a, b) => {
      const dateA = new Date(a.paidAt || 0).getTime();
      const dateB = new Date(b.paidAt || 0).getTime();
      return dateB - dateA;
    });

  return memberContribs[0] || null;
}

export interface MemberCycleStatus {
  status: 'paid' | 'pending' | 'due';
  amount: number;
  contribution?: Contribution;
  cycleLabel: string;
}

/**
 * Calculate contribution status for a specific cycle (default: CURRENT_CYCLE_ID).
 */
export function getMemberCycleStatus(
  member: Member,
  contributions: Contribution[],
  cycleId: string = CURRENT_CYCLE_ID,
  cycleLabel: string = CURRENT_CYCLE_LABEL
): MemberCycleStatus {
  const cycleObj = getCycleById(cycleId);
  const cycleContrib = contributions.find((c) => {
    if (!isContributionForMember(c, member)) return false;
    if (cycleObj) {
      return isContributionInCycle(c, cycleObj);
    }
    return c.weekCycle === cycleId;
  });

  if (cycleContrib && cycleContrib.confirmedByTreasurer) {
    return {
      status: 'paid',
      amount: cycleContrib.amount,
      contribution: cycleContrib,
      cycleLabel,
    };
  }

  if (cycleContrib && !cycleContrib.confirmedByTreasurer) {
    return {
      status: 'pending',
      amount: cycleContrib.amount,
      contribution: cycleContrib,
      cycleLabel,
    };
  }

  return {
    status: 'due',
    amount: MIN_WEEKLY_CONTRIBUTION,
    cycleLabel,
  };
}
