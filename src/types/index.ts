export type MemberRole = 'Coordinator' | 'Treasurer' | 'Verification Team' | 'Core Member';

export type UserTier = 'core_member' | 'supporter' | 'public';

export type CaseStatus = 'Reported' | 'Under Discussion' | 'Approved' | 'Declined' | 'Released' | 'Closed';

export type CaseCategory = 'Medical' | 'Education' | 'Ration / Food' | 'Urgent Debt / Rent' | 'Livelihood / Skill' | 'Emergency / General';

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: MemberRole;
  isActive: boolean;
  joinedAt: string;
  notes?: string;
}

export interface CaseDecision {
  status: 'Approved' | 'Declined';
  approvedAmount?: number;
  decidedBy: string;
  decidedAt: string;
  notes?: string;
}

export interface CaseAgreement {
  memberId: string;
  memberName: string;
  agreed: boolean;
  suggestedAmount?: number;
  note?: string;
  timestamp: string;
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorRole: MemberRole;
  content: string;
  createdAt: string;
}

export interface CaseItem {
  id: string;
  caseNumber: string; // e.g., CASE-001
  title: string;
  category: CaseCategory;
  reporterId: string;
  reporterName: string;
  beneficiarySituation: string; // Private to Core Members
  helpRequired: string;
  approxAmountRequested: number;
  approvedAmount?: number;
  releasedAmount?: number;
  verificationNotes?: string;
  verificationOfficer?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  agreements?: CaseAgreement[];
  decision?: CaseDecision;
  publicPurposeSummary?: string; // Sanitized public label (e.g., "Emergency Medical Prescription Support")
}

export interface Withdrawal {
  id: string;
  timestamp: string;
  amount: number;
  memberName: string; // Core member who received/released
  memberId?: string;
  remark: string;
  purposeCategory: CaseCategory;
  linkedCaseId?: string;
  linkedCaseNumber?: string;
  recordedBy: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  weekCycle: string; // e.g. "2026-W38"
  cycleLabel: string; // e.g. "Sep 15 - Sep 21, 2026"
  amount: number;
  paidAt: string;
  confirmedByTreasurer: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  type: 'contribution' | 'withdrawal';
  amount: number;
  purposeOrSource: string;
  caseReference?: string;
  recordedBy: string;
  runningBalance: number;
  rawCategory?: CaseCategory;
}

export interface FundStats {
  totalCollected: number;
  totalReleased: number;
  currentBalance: number;
  casesHelped: number;
  activeContributors: number;
  weeklyTarget: number;
  currentWeeklyCollected: number;
}
