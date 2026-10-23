import { LedgerEntry } from '../types';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateVal: any): string {
  if (!dateVal) return '—';
  try {
    let d: Date;
    if (typeof dateVal === 'string') {
      d = new Date(dateVal);
    } else if (dateVal && typeof dateVal.toDate === 'function') {
      d = dateVal.toDate();
    } else if (dateVal && typeof dateVal.seconds === 'number') {
      d = new Date(dateVal.seconds * 1000);
    } else if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date();
    }
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatShortDate(dateVal: any): string {
  if (!dateVal) return '—';
  try {
    let d: Date;
    if (typeof dateVal === 'string') {
      d = new Date(dateVal);
    } else if (dateVal && typeof dateVal.toDate === 'function') {
      d = dateVal.toDate();
    } else if (dateVal && typeof dateVal.seconds === 'number') {
      d = new Date(dateVal.seconds * 1000);
    } else if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date();
    }
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return '—';
  }
}

export function getRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatShortDate(dateStr);
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppUrl(messageText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(messageText)}`;
}

import { Member } from '../types';

export function resolveMemberName(idOrName?: string, members: Member[] = []): string {
  if (!idOrName) return '—';
  const match = members.find(m => m.id === idOrName || m.uid === idOrName);
  if (match) return match.name;
  return idOrName; // Fallback: If it's already a display name on an older document, return as-is
}

function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Mitigate CSV Formula Injection (CWE-1236) by prepending a quote if leading character is =, +, -, or @
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportLedgerToCSV(ledger: LedgerEntry[], filename = 'fikr-ledger-export.csv') {
  const headers = ['Date & Time', 'Type', 'Amount (INR)', 'Purpose / Reference', 'Case Ref', 'Recorded By', 'Running Balance', 'Status', 'Void Reason'];
  const rows = ledger.map(entry => [
    sanitizeCsvCell(formatDate(entry.timestamp)),
    sanitizeCsvCell(entry.type.toUpperCase()),
    entry.status === 'voided' ? 0 : entry.amount,
    sanitizeCsvCell(entry.purposeOrSource || ''),
    sanitizeCsvCell(entry.caseReference || '—'),
    sanitizeCsvCell(entry.recordedBy || ''),
    entry.runningBalance,
    sanitizeCsvCell(entry.status === 'voided' ? 'VOIDED' : 'ACTIVE'),
    sanitizeCsvCell(entry.voidReason || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sanitizePublicPurpose(category: string, rawRemark: string): string {
  // If remark has sensitive beneficiary names, provide standard category wording
  // Or strip any obvious personal details
  if (!rawRemark) return `${category} Assistance`;
  return rawRemark;
}
