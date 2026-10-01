'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Drawer } from 'vaul';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PaymentTable from '@/components/PaymentTable';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

const StatusBadge = ({ 
  status, 
  layout = 'desktop' 
}: { 
  status: { label: string, color: string, subLabel?: string },
  layout?: 'desktop' | 'mobile'
}) => {
  const colorClasses = {
    paid: "border-paid-line bg-paid-soft text-paid",
    behind: "border-behind-line bg-behind-soft text-behind",
    flag: "border-flag-line bg-flag-soft text-flag",
    gray: "border-line bg-white text-muted"
  };

  const containerClasses = layout === 'desktop' 
    ? "flex flex-col items-center gap-1"
    : "flex items-center gap-2";

  return (
    <div className={containerClasses}>
      <span className={`status-badge inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[status.color as keyof typeof colorClasses] || colorClasses.gray}`}>
        {status.label}
      </span>
      {status.subLabel && (
        <span className="text-xs text-muted font-medium">
          {status.subLabel}
        </span>
      )}
    </div>
  );
};

export default function LedgerView() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<any[]>([]);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Payment schedules state
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([]);
  const [scheduleFilter, setScheduleFilter] = useState(searchParams.get('schedule') || '');
  const [schedulePaymentStatus, setSchedulePaymentStatus] = useState(searchParams.get('scheduleStatus') || ''); // 'all', 'paid', 'unpaid'
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sectionFilter, setSectionFilter] = useState(searchParams.get('section') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [lateFilter, setLateFilter] = useState(searchParams.get('late') === 'true');
  const [sortField, setSortField] = useState<'name' | 'section' | 'paid' | 'remaining' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter Pills State
  const activeFilterPill = lateFilter ? 'Late' : 
    (scheduleFilter && schedulePaymentStatus === 'paid') ? 'Fully Paid' :
    (scheduleFilter && schedulePaymentStatus === 'unpaid') ? 'Unpaid' :
    (!scheduleFilter && statusFilter === 'paid') ? 'Fully Paid' :
    statusFilter === 'partial' ? 'Partial' :
    (!scheduleFilter && statusFilter === 'outstanding') ? 'Unpaid' : 'All';

  const handleFilterPillClick = (filter: string) => {
    // Reset all filters first
    setStatusFilter('');
    setLateFilter(false);
    if (scheduleFilter) {
      setSchedulePaymentStatus('');
    }
    
    switch (filter) {
      case 'Late':
        setLateFilter(true);
        break;
      case 'Unpaid':
        if (scheduleFilter) {
          setSchedulePaymentStatus('unpaid');
        } else {
          setStatusFilter('outstanding');
        }
        break;
      case 'Partial':
        setStatusFilter('partial');
        break;
      case 'Fully Paid':
        if (scheduleFilter) {
          setSchedulePaymentStatus('paid');
        } else {
          setStatusFilter('paid');
        }
        break;
      case 'All':
      default:
        // Already reset
        break;
    }
  };


  useEffect(() => {
    // Fetch members
    fetch('/api/members/ledger?includeArchived=true', { cache: 'no-store' })
      .then(res => res.json())
      .then(setMembers)
      .finally(() => setLoading(false));
    
    // Fetch payment schedules
    fetch('/api/payment-schedules?active=true')
      .then(res => res.json())
      .then(setPaymentSchedules)
      .catch(err => console.error('Error fetching payment schedules:', err));
  }, []);

  const toggleOpen = (id: string) => {
    setOpenMemberId(openMemberId === id ? null : id);
  };

  const navigateToMember = (memberId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click event
    router.push(`/dashboard/members/${memberId}`);
  };

  const handleUnassign = async (paymentId: string) => {
    const res = await fetch(`/api/payments/unassign`, {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const updated = await res.json();
      setMembers(updated);
    }
  };

  // Fuzzy search function
  const fuzzySearch = (text: string, term: string): boolean => {
    if (!term) return true;
    
    const cleanText = text.toLowerCase().replace(/\s+/g, '');
    const cleanTerm = term.toLowerCase().replace(/\s+/g, '');
    
    if (cleanText.includes(cleanTerm)) return true;
    
    // Check for partial matches and character similarity
    let termIndex = 0;
    for (let i = 0; i < cleanText.length && termIndex < cleanTerm.length; i++) {
      if (cleanText[i] === cleanTerm[termIndex]) {
        termIndex++;
      }
    }
    return termIndex === cleanTerm.length;
  };

  // Helper function to check if member paid for a specific schedule
  const hasPaidForSchedule = (member: any, scheduleId: string) => {
    return member.paymentGroups?.some((group: any) => 
      group.schedule?.id === scheduleId
    );
  };

  // Calculate total amount paid for a specific payment schedule
  const calculateScheduleTotal = (scheduleId: string) => {
    if (!scheduleId) return 0;
    
    return members.reduce((total, member) => {
      const scheduleGroup = member.paymentGroups?.find((group: any) => 
        group.schedule?.id === scheduleId
      );
      
      if (scheduleGroup) {
        const schedulePayments = scheduleGroup.payments || [];
        const memberScheduleTotal = schedulePayments.reduce((sum: number, payment: any) => 
          sum + (payment.amountPaid || 0), 0
        );
        return total + memberScheduleTotal;
      }
      
      return total;
    }, 0);
  };

  // Helper to get status display data based on current filters
  const getMemberStatusDisplay = (member: any) => {
    // Scenario 1: Specific Schedule Selected
    if (scheduleFilter) {
      const schedule = paymentSchedules.find(s => s.id === scheduleFilter);
      if (!schedule) return { label: 'Unknown', color: 'gray' };

      const scheduleGroup = member.paymentGroups?.find((group: any) => 
        group.schedule?.id === scheduleFilter
      );
      
      const amountPaid = scheduleGroup?.payments?.reduce((sum: number, p: any) => sum + Number(p.amountPaid || 0), 0) || 0;
      const scheduleAmount = Number(schedule.amount || 0);
      const remaining = Math.max(0, scheduleAmount - amountPaid);
      
      // Check if fully paid
      if (amountPaid >= scheduleAmount || member.status === 'paid') {
        return { label: 'Paid', color: 'paid' };
      }
      
      // Partial payment
      if (amountPaid > 0) {
        return { 
          label: 'Partial', 
          subLabel: `$${remaining.toFixed(2)} left`, 
          color: 'flag' 
        };
      }
      
      // No payment: only "behind" once the due date has passed
      const due = new Date(schedule.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { label: 'Unpaid', color: dueDay < today ? 'behind' : 'gray' };
    }

    // Scenario 2: No Schedule Selected (Overall Status)
    // User requested: "list the members status as 'behind' or something similar if they are under the total amount of all payment schedules"
    
    const totalScheduledPastDue = paymentSchedules.reduce((sum, s) => {
      const due = new Date(s.dueDate);
      const now = new Date();
      // Compare dates only - strictly past due means due date is before today
      const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dueDate < today) {
        return sum + Number(s.amount || 0);
      }
      return sum;
    }, 0);

    const totalPaid = Number(member.totalPaid || 0);
    const memberTuition = Number(member.tuitionAmount || 0);
    const remaining = Number(member.remaining || 0);

    // Members owe each schedule's amount as it comes due, up to their own tuition;
    // a reduced tuition (e.g. vet discount) comes off the final payments. This
    // doesn't depend on the season's schedules all being entered yet.
    const expectedPastDueForMember = Math.min(memberTuition, totalScheduledPastDue);

    // Only show Paid in Full if they have actually paid the full amount of all schedules
    if (remaining <= 0) {
      return { label: 'Paid in Full', color: 'paid' };
    }
    
    if (totalPaid >= expectedPastDueForMember) {
      return { label: 'Current', color: 'paid' };
    }

    const amountBehind = Math.min(remaining, expectedPastDueForMember - totalPaid);
    return { 
      label: `Behind - $${amountBehind.toFixed(2)}`, 
      color: 'behind' 
    };
  };

  // Filter and sort members
  const filteredAndSortedMembers = members
    .filter(member => {
      // Section filter
      if (sectionFilter && member.section !== sectionFilter) return false;
      
      // Status filter
      if (statusFilter) {
        if (statusFilter === 'outstanding') {
          if (member.status === 'paid') return false;
        } else if (member.status !== statusFilter) {
          return false;
        }
      }

      // Late payment filter
      if (lateFilter && (!member.latePaymentsCount || member.latePaymentsCount === 0)) return false;
      
      // Payment schedule filter - now only filters if schedulePaymentStatus is set
      if (scheduleFilter && schedulePaymentStatus) {
        const hasPaymentForSchedule = hasPaidForSchedule(member, scheduleFilter);
        const isPaidInFull = member.status === 'paid';
        
        if (schedulePaymentStatus === 'paid' && !hasPaymentForSchedule && !isPaidInFull) {
          return false;
        }
        
        if (schedulePaymentStatus === 'unpaid' && (hasPaymentForSchedule || isPaidInFull)) {
          return false;
        }
      }
      
      // Fuzzy search across multiple fields
      if (searchTerm) {
        const searchableText = [
          member.name,
          member.section,
          member.status
        ].filter(Boolean).join(' ');
        
        return fuzzySearch(searchableText, searchTerm);
      }
      
      return true;
    })
    .sort((a, b) => {
      const aArchived = a.archived === true || a.isActive === false;
      const bArchived = b.archived === true || b.isActive === false;

      // Always keep archived members at the bottom, regardless of selected sort.
      if (aArchived !== bArchived) {
        return aArchived ? 1 : -1;
      }

      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'section':
          aValue = (a.section || '').toLowerCase();
          bValue = (b.section || '').toLowerCase();
          break;
        case 'paid':
          aValue = a.totalPaid || 0;
          bValue = b.totalPaid || 0;
          break;
        case 'remaining':
          aValue = a.remaining || 0;
          bValue = b.remaining || 0;
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'name' | 'section' | 'paid' | 'remaining' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getCollectionPercent = (member: any) => {
    const paid = Number(member.totalPaid || 0);
    const remaining = Number(member.remaining || 0);
    const tuition = Number(member.tuitionAmount || 0);
    const totalExpected = tuition > 0 ? tuition : paid + Math.max(remaining, 0);

    if (totalExpected <= 0) return 0;
    return Math.min(100, Math.max(0, (paid / totalExpected) * 100));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSectionFilter('');
    setStatusFilter('');
    setScheduleFilter('');
    setSchedulePaymentStatus('');
    setLateFilter(false);
  };

  const hasActiveFilters =
    !!searchTerm ||
    !!sectionFilter ||
    !!scheduleFilter ||
    !!lateFilter ||
    (statusFilter && statusFilter !== 'outstanding' && statusFilter !== 'partial' && statusFilter !== 'paid');

  const filteredActiveMembersCount = filteredAndSortedMembers.filter(
    (member) => !(member.archived === true || member.isActive === false)
  ).length;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ink mx-auto mb-4"></div>
          <p className="text-xl text-muted">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
        <div className="hidden sm:block mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">Member Ledger</h1>
              <p className="text-lg sm:text-xl text-muted">Track all member payments and balances</p>
            </div>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-20 ">
            <div className="w-24 h-24 bg-canvas rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-ink rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">$</span>
              </div>
            </div>
            <p className="text-black text-2xl font-bold mb-3">No payment data found</p>
            <p className="text-muted text-lg font-medium">Member payment data will appear here once available</p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1400px] space-y-4">
                <div className="rounded-2xl ">
                  <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)_auto] lg:items-center">
                    <select
                      value={scheduleFilter}
                      onChange={(e) => {
                        setScheduleFilter(e.target.value);
                        setStatusFilter('');
                        setLateFilter(false);
                        setSchedulePaymentStatus('');
                      }}
                      className="w-full appearance-none rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-black focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="">All Payment Schedules</option>
                      {paymentSchedules.map(schedule => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.name} - Due: {new Date(schedule.dueDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>

                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search members"
                        className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-black placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
                        className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-wash"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <div className="hidden lg:block"></div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {['All', 'Late', 'Unpaid', 'Partial', 'Fully Paid'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => handleFilterPillClick(filter)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                          activeFilterPill === filter
                            ? 'scale-[1.02] border-white bg-white text-neutral-900'
                            : 'border-line bg-white text-muted hover:border-ink hover:text-black'
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-col items-start justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
                  <span>
                    Showing {filteredActiveMembersCount} active members of {members.length} total members
                    {searchTerm && (
                      <span className="ml-2 font-medium text-ink">for &ldquo;{searchTerm}&rdquo;</span>
                    )}
                    {sectionFilter && (
                      <span className="ml-2 font-medium text-ink">in {sectionFilter}</span>
                    )}
                    {statusFilter && (
                      <span className="ml-2 font-medium text-ink">with {statusFilter} status</span>
                    )}
                    {scheduleFilter && !schedulePaymentStatus && (
                      <span className="ml-2 font-medium text-ink">
                        with payment status for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                      </span>
                    )}
                    {scheduleFilter && schedulePaymentStatus && (
                      <span className="ml-2 font-medium text-ink">
                        {schedulePaymentStatus === 'paid' && 'who paid '}
                        {schedulePaymentStatus === 'unpaid' && 'who have not paid '}
                        for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <span>
                      Sorted by {sortField} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                    </span>
                    {scheduleFilter && (
                      <div className="rounded-lg border border-line bg-white px-4 py-2">
                        <span className="font-semibold text-black">Total Paid This Schedule: </span>
                        <span className="font-bold text-ink">${calculateScheduleTotal(scheduleFilter).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {filteredAndSortedMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No members found</h3>
              <p className="text-muted">
                {lateFilter 
                  ? "No late payments—everyone's up to date!" 
                  : "Try adjusting your filters or search terms."}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSectionFilter('');
                  setStatusFilter('');
                  setScheduleFilter('');
                  setSchedulePaymentStatus('');
                  setLateFilter(false);
                }}
                className="mt-6 px-4 py-2 border border-line bg-white hover:bg-wash text-black rounded-lg font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-line bg-white">
                      <th className="w-[48%] p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-black transition-colors duration-200 hover:text-muted"
                        >
                          Member
                          {sortField === 'name' && (
                            <span className="text-ink">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="w-[28%] p-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        <button
                          onClick={() => handleSort('remaining')}
                          className="ml-auto flex items-center gap-2 text-black transition-colors duration-200 hover:text-muted"
                        >
                          Balance Remaining
                          {sortField === 'remaining' && (
                            <span className="text-ink">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="w-[24%] p-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        <button
                          onClick={() => handleSort('status')}
                          className="mx-auto flex items-center gap-2 text-black transition-colors duration-200 hover:text-muted"
                        >
                          Status
                          {sortField === 'status' && (
                            <span className="text-ink">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedMembers.map((m) => (
                      <React.Fragment key={m.id}>
                        {(() => {
                          const isArchivedMember = m.archived === true || m.isActive === false;
                          return (
                        <tr
                          className="cursor-pointer border-b border-line transition-colors duration-200 odd:bg-white even:bg-wash hover:bg-canvas"
                          onClick={() => toggleOpen(m.id)}
                        >
                          <td className="p-4 text-black">
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={(e) => navigateToMember(m.id, e)}
                                className="text-left !text-xl font-bold leading-tight tracking-[-0.03em] text-black transition-colors duration-200 hover:text-black"
                              >
                                {m.name}
                              </button>
                              <p className="text-xs text-muted">{m.section || 'Unassigned section'}</p>
                              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Tap row for payment detail</p>
                              {scheduleFilter && (
                                <div className="flex items-center gap-1">
                                  {hasPaidForSchedule(m, scheduleFilter) || m.status === 'paid' ? (
                                    <span className="inline-flex items-center rounded-full border border-paid-line bg-paid-soft px-2.5 py-0.5 text-xs font-semibold text-paid">
                                      Schedule paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-semibold text-muted">
                                      Schedule unpaid
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            {isArchivedMember ? (
                              <>
                                <p className="font-mono text-lg font-semibold tabular-nums text-black">--</p>
                                <p className="mt-1 text-xs text-muted">Archived member</p>
                              </>
                            ) : (
                              <>
                                <p className={cn(
                                  'font-mono text-lg font-semibold tabular-nums',
                                  Number(m.remaining || 0) > 0 ? 'text-ink' : 'text-black'
                                )}>
                                  {formatMoney(Number(m.remaining || 0))}
                                </p>
                                <p className="mt-1 text-xs text-muted">Paid to date {formatMoney(Number(m.totalPaid || 0))}</p>
                                <p className="mt-0.5 text-xs text-muted">
                                  {Number(m.remaining || 0) > 0 ? `${Math.round(getCollectionPercent(m))}% collected` : 'Paid in full'}
                                </p>
                              </>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="space-y-1.5">
                              {isArchivedMember ? (
                                <span className="inline-flex items-center rounded-full border border-black bg-black px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                                  Archived
                                </span>
                              ) : (
                                <StatusBadge status={getMemberStatusDisplay(m)} layout="desktop" />
                              )}
                              {!isArchivedMember && m.latePaymentsCount > 0 ? (
                                <span className="inline-flex items-center rounded-full border border-flag-line bg-flag-soft px-2.5 py-0.5 text-xs font-semibold text-flag">
                                  {m.latePaymentsCount} late
                                </span>
                              ) : !isArchivedMember ? (
                                <span className="text-xs text-muted">On time</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                          );
                        })()}

                        {openMemberId === m.id && (
                          <tr>
                            <td colSpan={3} className="border-b border-line bg-wash p-6">
                              <PaymentTable 
                                payments={m.payments} 
                                paymentGroups={m.paymentGroups}
                                onUnassign={handleUnassign} 
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {filteredAndSortedMembers.map((m) => (
                  (() => {
                    const isArchivedMember = m.archived === true || m.isActive === false;
                    return (
                  <div key={m.id} className="border-b border-line last:border-b-0">
                    <div
                      className="p-4 cursor-pointer hover:bg-wash transition-colors duration-200 active:bg-canvas"
                      onClick={() => setSelectedMember(m)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-left text-2xl font-bold leading-tight tracking-[-0.03em] text-black">
                            {m.name}
                          </div>
                          <p className="text-muted text-sm">{m.section}</p>
                          {scheduleFilter && (
                            <div className="mt-2 flex items-center gap-1">
                              {hasPaidForSchedule(m, scheduleFilter) || m.status === 'paid' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-paid-line bg-paid-soft text-paid font-semibold">
                                  ✓ Paid for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-line bg-white text-muted font-semibold">
                                  ✗ Not Paid for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-ink font-semibold">${m.totalPaid.toFixed(2)}</div>
                          {isArchivedMember ? (
                            <div className="font-semibold text-sm text-black">--</div>
                          ) : (
                            <div className="text-ink font-semibold text-sm">${m.remaining.toFixed(2)} remaining</div>
                          )}
                          {!isArchivedMember && m.latePaymentsCount > 0 && (
                            <div className="text-flag text-xs mt-1">
                              {m.latePaymentsCount} late payment{m.latePaymentsCount !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          {isArchivedMember ? (
                            <span className="inline-flex items-center rounded-full border border-black bg-black px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              Archived
                            </span>
                          ) : (
                            <StatusBadge status={getMemberStatusDisplay(m)} layout="mobile" />
                          )}
                        </div>
                        <div className="text-muted text-sm">
                          Tap for details
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            </>
          )}
          </div>
          </div>
        )}

      {/* Mobile Member Detail Drawer */}
      <Drawer.Root open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-line outline-none">
            <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-line mb-8" />
              
              {selectedMember && (
                <div className="max-w-md mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-black mb-1">{selectedMember.name}</h2>
                    <p className="text-muted text-lg">{selectedMember.section}</p>
                    <div className="mt-4 flex gap-4">
                      <div>
                        <p className="text-xs text-muted uppercase tracking-[0.2em]">Total Paid</p>
                        <p className="text-xl font-bold text-ink">${selectedMember.totalPaid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-[0.2em]">Remaining</p>
                        <p className="text-xl font-bold text-ink">${selectedMember.remaining.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-black border-b border-line pb-2">Payment Schedule</h3>
                    <div className="relative border-l-2 border-line ml-3 space-y-8 pb-4">
                      {paymentSchedules.map((schedule, idx) => {
                        const isPaid = hasPaidForSchedule(selectedMember, schedule.id) || selectedMember.status === 'paid';
                        const isPastDue = new Date(schedule.dueDate) < new Date() && !isPaid;
                        
                        return (
                          <div key={schedule.id} className="relative pl-8">
                            <div className={cn(
                              "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2",
                              isPaid ? "bg-paid-solid border-paid-solid" : 
                              isPastDue ? "bg-behind-solid border-behind-solid" : "bg-white border-line-strong"
                            )} />
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-black font-medium">{schedule.name}</p>
                                <p className="text-sm text-muted">Due {new Date(schedule.dueDate).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className={cn(
                                  "font-bold",
                                  isPaid ? "text-paid" : isPastDue ? "text-behind" : "text-muted"
                                )}>
                                  {isPaid ? 'Paid' : isPastDue ? 'Overdue' : 'Pending'}
                                </p>
                                <p className="text-sm text-muted">${Number(schedule.amount).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-line mt-auto">
              <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push(`/dashboard/members/${selectedMember?.id}`)}
                  className="w-full py-3 px-4 bg-white hover:bg-wash text-black rounded-xl font-semibold transition-colors border border-line"
                >
                  View Full Profile
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/members/${selectedMember?.id}#add-payment`)}
                  className="w-full py-3 px-4 bg-ink hover:bg-ink-hover text-white rounded-xl font-semibold transition-colors border border-ink"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}
