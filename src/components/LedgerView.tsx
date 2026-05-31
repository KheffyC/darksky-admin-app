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
    green: "bg-green-500/40 text-green-900 border-green-400/30",
    blue: "bg-blue-500/40 text-blue-900 border-blue-400/30",
    yellow: "bg-yellow-500/40 text-yellow-900 border-yellow-400/30",
    orange: "bg-orange-500/40 text-orange-900 border-orange-400/30",
    red: "bg-red-500/40 text-red-900 border-red-400/30",
    gray: "bg-gray-500/40 text-gray-900 border-gray-400/30"
  };

  const containerClasses = layout === 'desktop' 
    ? "flex flex-col items-center gap-1"
    : "flex items-center gap-2";

  return (
    <div className={containerClasses}>
      <span className={`status-badge inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${colorClasses[status.color as keyof typeof colorClasses] || colorClasses.gray}`}>
        {status.label}
      </span>
      {status.subLabel && (
        <span className="text-xs text-gray-400 font-medium">
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
        return { label: 'Paid', color: 'green' };
      }
      
      // Partial payment
      if (amountPaid > 0) {
        return { 
          label: 'Partial', 
          subLabel: `$${remaining.toFixed(2)} left`, 
          color: 'yellow' 
        };
      }
      
      // No payment
      return { label: 'Unpaid', color: 'red' };
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

    const totalScheduledSeason = paymentSchedules.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const totalPaid = Number(member.totalPaid || 0);
    const memberTuition = Number(member.tuitionAmount || 0);
    const remaining = Number(member.remaining || 0);

    // When tuition is customized per member, expected amount due-to-date should scale
    // with that member's tuition instead of using raw global schedule totals.
    const dueProgress = totalScheduledSeason > 0
      ? Math.min(1, Math.max(0, totalScheduledPastDue / totalScheduledSeason))
      : 0;
    const expectedPastDueForMember = memberTuition * dueProgress;

    // Only show Paid in Full if they have actually paid the full amount of all schedules
    if (remaining <= 0) {
      return { label: 'Paid in Full', color: 'green' };
    }
    
    if (totalPaid >= expectedPastDueForMember) {
      return { label: 'Current', color: 'blue' };
    }

    const amountBehind = Math.min(remaining, expectedPastDueForMember - totalPaid);
    return { 
      label: `Behind - $${amountBehind.toFixed(2)}`, 
      color: 'orange' 
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl text-[#788896]">Loading ledger...</p>
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
              <p className="text-lg sm:text-xl text-[#788896]">Track all member payments and balances</p>
            </div>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-20 ">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">$</span>
              </div>
            </div>
            <p className="text-black text-2xl font-bold mb-3">No payment data found</p>
            <p className="text-[#788896] text-lg font-medium">Member payment data will appear here once available</p>
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
                      className="w-full appearance-none rounded-xl border border-[#d6dde5] bg-white px-4 py-2.5 text-sm text-black focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
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
                        className="w-full rounded-xl border border-[#d6dde5] bg-white py-2.5 pl-10 pr-3 text-sm text-black placeholder:text-[#788896] focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                      />
                      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
                        className="rounded-lg border border-[#d6dde5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-[#f7f9fb]"
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
                            ? 'scale-[1.02] border-white bg-white text-slate-900'
                            : 'border-[#d6dde5] bg-white text-[#788896] hover:border-[#f38d68] hover:text-black'
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-col items-start justify-between gap-3 text-sm text-[#788896] sm:flex-row sm:items-center">
                  <span>
                    Showing {filteredActiveMembersCount} active members of {members.length} total members
                    {searchTerm && (
                      <span className="ml-2 text-blue-400">for &ldquo;{searchTerm}&rdquo;</span>
                    )}
                    {sectionFilter && (
                      <span className="ml-2 text-green-400">in {sectionFilter}</span>
                    )}
                    {statusFilter && (
                      <span className="ml-2 text-yellow-400">with {statusFilter} status</span>
                    )}
                    {scheduleFilter && !schedulePaymentStatus && (
                      <span className="ml-2 text-purple-400">
                        with payment status for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                      </span>
                    )}
                    {scheduleFilter && schedulePaymentStatus && (
                      <span className="ml-2 text-purple-400">
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
                      <div className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2">
                        <span className="font-semibold text-black">Total Paid This Schedule: </span>
                        <span className="font-bold text-emerald-700">${calculateScheduleTotal(scheduleFilter).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#d6dde5] bg-white">
          {filteredAndSortedMembers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No members found</h3>
              <p className="text-[#788896]">
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
                className="mt-6 px-4 py-2 border border-[#d6dde5] bg-white hover:bg-[#f7f9fb] text-black rounded-lg font-medium transition-colors"
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
                    <tr className="sticky top-0 z-10 border-b border-[#d6dde5] bg-white">
                      <th className="w-[48%] p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-black transition-colors duration-200 hover:text-[#0D47A1]"
                        >
                          Member
                          {sortField === 'name' && (
                            <span className="text-emerald-300">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="w-[28%] p-4 text-right text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">
                        <button
                          onClick={() => handleSort('remaining')}
                          className="ml-auto flex items-center gap-2 text-black transition-colors duration-200 hover:text-[#0D47A1]"
                        >
                          Balance Remaining
                          {sortField === 'remaining' && (
                            <span className="text-emerald-300">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="w-[24%] p-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">
                        <button
                          onClick={() => handleSort('status')}
                          className="mx-auto flex items-center gap-2 text-black transition-colors duration-200 hover:text-[#0D47A1]"
                        >
                          Status
                          {sortField === 'status' && (
                            <span className="text-emerald-300">
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
                          className="cursor-pointer border-b border-[#e8edf3] transition-colors duration-200 odd:bg-white even:bg-[#f9fbfd] hover:bg-[#eef3f8]"
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
                              <p className="text-xs text-[#788896]">{m.section || 'Unassigned section'}</p>
                              <p className="text-[11px] uppercase tracking-[0.2em] text-[#788896]">Tap row for payment detail</p>
                              {scheduleFilter && (
                                <div className="flex items-center gap-1">
                                  {hasPaidForSchedule(m, scheduleFilter) || m.status === 'paid' ? (
                                    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                                      Schedule paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-500/40 px-2.5 py-0.5 text-xs font-semibold text-rose-900">
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
                                <p className="mt-1 text-xs text-[#788896]">Archived member</p>
                              </>
                            ) : (
                              <>
                                <p className={cn(
                                  'font-mono text-lg font-semibold tabular-nums',
                                  Number(m.remaining || 0) > 0 ? 'text-[#f38d68]' : 'text-black'
                                )}>
                                  {formatMoney(Number(m.remaining || 0))}
                                </p>
                                <p className="mt-1 text-xs text-[#788896]">Paid to date {formatMoney(Number(m.totalPaid || 0))}</p>
                                <p className="mt-0.5 text-xs text-[#788896]">
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
                                <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-500/40 px-2.5 py-0.5 text-xs font-semibold text-rose-900">
                                  {m.latePaymentsCount} late
                                </span>
                              ) : !isArchivedMember ? (
                                <span className="text-xs text-[#788896]">On time</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                          );
                        })()}

                        {openMemberId === m.id && (
                          <tr>
                            <td colSpan={3} className="border-b border-[#e8edf3] bg-[#f9fbfd] p-6">
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
                  <div key={m.id} className="border-b border-[#e8edf3] last:border-b-0">
                    <div
                      className="p-4 cursor-pointer hover:bg-[#f7f9fb] transition-colors duration-200 active:bg-[#eef3f8]"
                      onClick={() => setSelectedMember(m)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-left text-2xl font-bold leading-tight tracking-[-0.03em] text-black">
                            {m.name}
                          </div>
                          <p className="text-[#788896] text-sm">{m.section}</p>
                          {scheduleFilter && (
                            <div className="mt-2 flex items-center gap-1">
                              {hasPaidForSchedule(m, scheduleFilter) || m.status === 'paid' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/40 text-green-900 font-semibold border border-green-400/30">
                                  ✓ Paid for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500/40 text-red-900 font-semibold border border-red-400/30">
                                  ✗ Not Paid for {paymentSchedules.find(s => s.id === scheduleFilter)?.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-700 font-semibold">${m.totalPaid.toFixed(2)}</div>
                          {isArchivedMember ? (
                            <div className="font-semibold text-sm text-black">--</div>
                          ) : (
                            <div className="text-[#f38d68] font-semibold text-sm">${m.remaining.toFixed(2)} remaining</div>
                          )}
                          {!isArchivedMember && m.latePaymentsCount > 0 && (
                            <div className="text-red-700 text-xs mt-1">
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
                        <div className="text-[#788896] text-sm">
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
          <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[90%] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-[#d6dde5] outline-none">
            <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#d6dde5] mb-8" />
              
              {selectedMember && (
                <div className="max-w-md mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-black mb-1">{selectedMember.name}</h2>
                    <p className="text-[#788896] text-lg">{selectedMember.section}</p>
                    <div className="mt-4 flex gap-4">
                      <div>
                        <p className="text-xs text-[#788896] uppercase tracking-[0.2em]">Total Paid</p>
                        <p className="text-xl font-bold text-emerald-700">${selectedMember.totalPaid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#788896] uppercase tracking-[0.2em]">Remaining</p>
                        <p className="text-xl font-bold text-[#f38d68]">${selectedMember.remaining.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-black border-b border-[#d6dde5] pb-2">Payment Schedule</h3>
                    <div className="relative border-l-2 border-[#d6dde5] ml-3 space-y-8 pb-4">
                      {paymentSchedules.map((schedule, idx) => {
                        const isPaid = hasPaidForSchedule(selectedMember, schedule.id) || selectedMember.status === 'paid';
                        const isPastDue = new Date(schedule.dueDate) < new Date() && !isPaid;
                        
                        return (
                          <div key={schedule.id} className="relative pl-8">
                            <div className={cn(
                              "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2",
                              isPaid ? "bg-green-500 border-green-500" : 
                              isPastDue ? "bg-red-500 border-red-500" : "bg-white border-[#cfd8e3]"
                            )} />
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-black font-medium">{schedule.name}</p>
                                <p className="text-sm text-[#788896]">Due {new Date(schedule.dueDate).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className={cn(
                                  "font-bold",
                                  isPaid ? "text-emerald-700" : isPastDue ? "text-red-700" : "text-[#788896]"
                                )}>
                                  {isPaid ? 'Paid' : isPastDue ? 'Overdue' : 'Pending'}
                                </p>
                                <p className="text-sm text-[#788896]">${Number(schedule.amount).toFixed(2)}</p>
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
            
            <div className="p-4 bg-white border-t border-[#d6dde5] mt-auto">
              <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push(`/dashboard/members/${selectedMember?.id}`)}
                  className="w-full py-3 px-4 bg-white hover:bg-[#f7f9fb] text-black rounded-xl font-semibold transition-colors border border-[#d6dde5]"
                >
                  View Full Profile
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/members/${selectedMember?.id}?action=payment`)}
                  className="w-full py-3 px-4 bg-emerald-300 hover:bg-emerald-400 text-black rounded-xl font-semibold transition-colors border border-emerald-400"
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
