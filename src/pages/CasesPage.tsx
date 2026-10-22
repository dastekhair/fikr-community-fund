import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { CaseCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatShortDate, getRelativeTime } from '../lib/utils';
import { CaseCategory, CaseItem } from '../types';
import { CASE_CATEGORIES } from '../lib/constants';

export const CasesPage: React.FC = () => {
  const { cases, loading, errors, timedOut } = useData();
  const { currentUser } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions: { label: string; value: string; count: number }[] = [
    { label: 'All Cases', value: 'all', count: cases.length },
    { label: 'Under Discussion', value: 'Under Discussion', count: cases.filter((c: CaseItem) => c.status === 'Under Discussion').length },
    { label: 'Approved', value: 'Approved', count: cases.filter((c: CaseItem) => c.status === 'Approved').length },
    { label: 'Released', value: 'Released', count: cases.filter((c: CaseItem) => c.status === 'Released').length },
    { label: 'Reported', value: 'Reported', count: cases.filter((c: CaseItem) => c.status === 'Reported').length },
    { label: 'Closed', value: 'Closed', count: cases.filter((c: CaseItem) => c.status === 'Closed' || c.status === 'Declined').length },
  ];

  const filteredCases = cases.filter((c: CaseItem) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.helpRequired.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reporterName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'Closed' ? (c.status === 'Closed' || c.status === 'Declined') : c.status === statusFilter);

    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e0e4dd] dark:border-[#1f261f] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Core Member Portal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0e0f0c] dark:text-[#f4f6f3]">
            Assistance Cases & Decisions
          </h1>
          <p className="text-sm text-[#454745] dark:text-[#a3aba1] mt-1 max-w-2xl font-normal">
            Review reported community needs, verify ground reality, discuss solutions, and record group approval outcomes.
          </p>
        </div>

        <Link to="/cases/new">
          <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
            Report New Case
          </Button>
        </Link>
      </div>

      {/* Privacy Notice Banner */}
      <PrivacyNotice compact />

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusOptions.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs font-semibold'
                  : 'bg-[#e8ebe6] dark:bg-[#181d18] text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.value
                  ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800'
                  : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cases by number, title, need, or scout..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 min-h-[44px] text-xs rounded-xl fikr-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs p-2.5 min-h-[44px] rounded-xl fikr-input"
            >
              <option value="all">All Categories</option>
              {CASE_CATEGORIES.map((cat: CaseCategory) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error or Timeout Notice */}
      {timedOut && loading && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs text-center">
          Loading is taking longer than expected. Please check your network connection or reload the page.
        </div>
      )}

      {errors.cases && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs text-center">
          {errors.cases}
        </div>
      )}

      {/* Case List Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {loading ? (
          <>
            <CaseCardSkeleton />
            <CaseCardSkeleton />
            <CaseCardSkeleton />
          </>
        ) : filteredCases.length === 0 ? (
          cases.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6 text-emerald-600" />}
              title="No cases yet"
              description="No community assistance requests or cases have been reported yet."
              actionLabel="Report New Case"
              actionHref="#/cases/new"
              actionIcon={<PlusCircle className="w-4 h-4" />}
            />
          ) : (
            <EmptyState
              icon={<Search className="w-6 h-6 text-neutral-400" />}
              title="No matching cases"
              description="There are no cases matching the selected status or filters."
              actionLabel="Reset Filters"
              onAction={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
            />
          )
        ) : (
          filteredCases.map((item: CaseItem) => {
            const agreementCount = item.agreements?.filter(a => a.agreed).length || 0;
            return (
              <Link
                key={item.id}
                to={`/cases/${item.id}`}
                className="group block p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] card-hover"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Case Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.caseNumber}
                      </span>
                      <CategoryBadge category={item.category} />
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.helpRequired}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400 pt-1">
                      <span>Reported by <strong>{item.reporterName}</strong></span>
                      <span>•</span>
                      <span>{getRelativeTime(item.createdAt)}</span>
                      {agreementCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {agreementCount} agreed
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Amounts & Arrow */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800 shrink-0">
                    <div className="sm:text-right">
                      <div className="text-[10px] uppercase font-semibold text-neutral-400">
                        {item.approvedAmount ? 'Approved Amount' : 'Approx Requested'}
                      </div>
                      <div className="text-lg font-bold text-neutral-900 dark:text-white">
                        {formatCurrency(item.approvedAmount || item.approxAmountRequested)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors sm:mt-2">
                      <span>Review Details</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
