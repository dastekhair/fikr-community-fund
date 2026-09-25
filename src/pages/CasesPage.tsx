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
import { formatCurrency, formatShortDate, getRelativeTime } from '../lib/utils';
import { CaseCategory, CaseItem } from '../types';
import { CASE_CATEGORIES } from '../lib/constants';

export const CasesPage: React.FC = () => {
  const { cases } = useData();
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Core Member Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Assistance Cases & Decisions
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
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
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs p-2 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

      {/* Case List Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredCases.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No cases found
            </div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              There are no cases matching the selected status or filters.
            </p>
          </div>
        ) : (
          filteredCases.map((item: CaseItem) => {
            const agreementCount = item.agreements?.filter(a => a.agreed).length || 0;
            return (
              <Link
                key={item.id}
                to={`/cases/${item.id}`}
                className="group block p-5 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800/80 card-hover"
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
