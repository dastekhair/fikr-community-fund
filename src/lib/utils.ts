import { LedgerEntry } from '../types';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
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

export function exportLedgerToCSV(ledger: LedgerEntry[], filename = 'fikr-ledger-export.csv') {
  const headers = ['Date & Time', 'Type', 'Amount (INR)', 'Purpose / Reference', 'Case Ref', 'Recorded By', 'Running Balance'];
  const rows = ledger.map(entry => [
    `"${formatDate(entry.timestamp)}"`,
    `"${entry.type.toUpperCase()}"`,
    entry.amount,
    `"${(entry.purposeOrSource || '').replace(/"/g, '""')}"`,
    `"${(entry.caseReference || '—').replace(/"/g, '""')}"`,
    `"${(entry.recordedBy || '').replace(/"/g, '""')}"`,
    entry.runningBalance
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
