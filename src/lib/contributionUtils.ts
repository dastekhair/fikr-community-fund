import { Contribution, Member } from '../types';
import { MIN_WEEKLY_CONTRIBUTION } from './constants';

export const CURRENT_CYCLE_ID = '2026-W38';
export const CURRENT_CYCLE_LABEL = 'Cycle Sep 15 – Sep 21, 2026';

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
  const cycleContrib = contributions.find(
    (c) => c.weekCycle === cycleId && isContributionForMember(c, member)
  );

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
