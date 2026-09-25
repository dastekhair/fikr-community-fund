import { Member, CaseCategory, MemberRole } from '../types';

export const APP_NAME = "Fikr";
export const APP_SUBTITLE = "Dast-e-Khair";
export const MIN_WEEKLY_CONTRIBUTION = 100;

export const MEMBER_ROLES: MemberRole[] = [
  'Admin',
  'Treasurer',
  'Coordinator',
  'Verification Team',
  'Core Member'
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-2',
    name: 'Amaan',
    email: 'amaan@fikr.org',
    role: 'Admin',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Administrator with authority to manage member roles, access permissions, and fund governance.'
  },
  {
    id: 'mem-5',
    name: 'Rizwan',
    email: 'rizwan@fikr.org',
    role: 'Treasurer',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Maintains fund ledger, receives & confirms UPI/cash contributions, and releases approved disbursements.'
  },
  {
    id: 'mem-1',
    name: 'Mohammad Yusuf',
    email: 'yusuf@fikr.org',
    role: 'Coordinator',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Manages case discussions, core group meetings, and general group coordination.'
  },
  {
    id: 'mem-3',
    name: 'Abdul Samad',
    email: 'samad@fikr.org',
    role: 'Verification Team',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Ground-level verification (Pharmacy liaison & medical needs assessment).'
  },
  {
    id: 'mem-4',
    name: 'Akif',
    email: 'akif@fikr.org',
    role: 'Verification Team',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Ground-level inspection, field verification, and case follow-ups.'
  },
  {
    id: 'mem-6',
    name: 'Belal',
    email: 'belal@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-7',
    name: 'Ali Zaid Ibrahim',
    email: 'alizaid@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-8',
    name: 'Imran',
    email: 'imran@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-9',
    name: 'Danish',
    email: 'danish@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  },
  {
    id: 'mem-10',
    name: 'Umar',
    email: 'umar@fikr.org',
    role: 'Core Member',
    isActive: true,
    joinedAt: '2026-01-01',
    notes: 'Active contributor and case decision participant.'
  }
];

export const CASE_CATEGORIES: CaseCategory[] = [
  'Medical',
  'Education',
  'Ration / Food',
  'Urgent Debt / Rent',
  'Livelihood / Skill',
  'Emergency / General'
];

/**
 * WhatsApp Message Templates (Zero-infrastructure, client-side only wa.me links)
 */
export const WHATSAPP_TEMPLATES = {
  weeklyReminder: () => `Dast-e-Khair
Weekly Fund Reminder

Dear all members,
This is a reminder to contribute a minimum of ₹100 every week.

Please make your weekly contribution on time so that we can continue helping people in need.

Dast-e-Khair`,

  fundSummary: (stats: { totalCollected: number; totalReleased: number; currentBalance: number; casesHelped: number }) => `Dast-e-Khair
Fund Summary

Total Collected: ₹${stats.totalCollected.toLocaleString('en-IN')}
Total Released: ₹${stats.totalReleased.toLocaleString('en-IN')}
Current Balance: ₹${stats.currentBalance.toLocaleString('en-IN')}
Cases Helped So Far: ${stats.casesHelped}

Thank you for your continued support.

Dast-e-Khair`,

  caseDiscussion: (caseItem: { caseNumber: string; category: string; helpRequired: string; approxAmountRequested: number }) => `Dast-e-Khair — New Case for Discussion

Case: ${caseItem.caseNumber} (${caseItem.category})
Need: ${caseItem.helpRequired}
Approx Requested: ₹${caseItem.approxAmountRequested.toLocaleString('en-IN')}

Please log in to the Fikr web app to review ground verification notes and share your approval/input.

Dast-e-Khair`
};

export const CORE_PRINCIPLES = {
  quote: "Start with ₹100. Build trust. Build a system. Build a community. Then, InshaAllah, build something that can genuinely serve people at a much larger scale.",
  mostImportantPrinciple: "This should not become a personal charity fund controlled by a few people. Most importantly, no one should be embarrassed or publicly exposed for receiving help. We are not trying to solve poverty — that would be unrealistic. But if our group can make even one person's difficult day a little easier, then our contributions will have served a meaningful purpose.",
  privacyRule: "Beneficiary names and identifying personal details are strictly private to verified Core Members and never exposed on any public page or export."
};
