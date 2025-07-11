'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentTable from '@/components/PaymentTable';
import { CSVExportButton } from '@/components/CSVExportButton';

export default function LedgerPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<'name' | 'section' | 'paid' | 'remaining' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetch('/api/members/ledger')
      .then(res => res.json())
      .then(setMembers)
      .finally(() => setLoading(false));
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

  // Get unique sections and statuses for filter dropdowns
  const uniqueSections = [...new Set(members.map(m => m.section).filter(Boolean))].sort();

  // Filter and sort members
  const filteredAndSortedMembers = members
    .filter(member => {
      // Section filter
      if (sectionFilter && member.section !== sectionFilter) return false;
      
      // Status filter
      if (statusFilter && member.status !== statusFilter) return false;
      
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

  // Prepare CSV data for ledger export
  const prepareLedgerCSVData = () => {
    if (!filteredAndSortedMembers || filteredAndSortedMembers.length === 0) return [];
    
    return filteredAndSortedMembers.map((member: any) => ({
      'Member Name': member.name || 'N/A',
      'Section': member.section || 'N/A',
      'Total Paid': `$${(member.totalPaid || 0).toFixed(2)}`,
      'Outstanding Balance': `$${(member.remaining || 0).toFixed(2)}`,
      'Payment Status': member.status || 'unknown',
      'Late Payments Count': member.latePaymentsCount || 0,
      'Collection Rate': member.totalPaid && member.remaining 
        ? `${Math.round((member.totalPaid / (member.totalPaid + member.remaining)) * 100)}%`
        : '0%',
      'Last Updated': new Date(member.updatedAt || Date.now()).toLocaleDateString()
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Loading ledger...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Member Ledger</h1>
              <p className="text-lg sm:text-xl text-gray-300">Track all member payments and balances</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/dashboard/members')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg"
              >
                View All Members
              </button>
              <CSVExportButton 
                data={prepareLedgerCSVData()} 
                filename="member_ledger.csv" 
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg"
              >
                Export CSV
              </CSVExportButton>
            </div>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600 shadow-xl">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">$</span>
              </div>
            </div>
            <p className="text-white text-2xl font-bold mb-3">No payment data found</p>
            <p className="text-gray-300 text-lg font-medium">Member payment data will appear here once available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search Members
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by member name, section, or status..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Section Filter */}
                <div className="lg:w-48">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Section
                  </label>
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Sections</option>
                    {uniqueSections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="lg:w-48">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid in Full</option>
                    <option value="partial">Partial Payment</option>
                    <option value="outstanding">Outstanding</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || sectionFilter || statusFilter) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSectionFilter('');
                        setStatusFilter('');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>
                  Showing {filteredAndSortedMembers.length} of {members.length} members
                  {searchTerm && (
                    <span className="ml-2 text-blue-400">
                      for &ldquo;{searchTerm}&rdquo;
                    </span>
                  )}
                  {sectionFilter && (
                    <span className="ml-2 text-green-400">
                      in {sectionFilter}
                    </span>
                  )}
                  {statusFilter && (
                    <span className="ml-2 text-yellow-400">
                      with {statusFilter} status
                    </span>
                  )}
                </span>
                <span>
                  Sorted by {sortField} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
            </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
                  <th className="text-left p-4 text-gray-200 font-semibold">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                    >
                      Name
                      {sortField === 'name' && (
                        <span className="text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 text-gray-200 font-semibold">
                    <button
                      onClick={() => handleSort('section')}
                      className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                    >
                      Section
                      {sortField === 'section' && (
                        <span className="text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 text-gray-200 font-semibold">
                    <button
                      onClick={() => handleSort('paid')}
                      className="flex items-center gap-2 hover:text-white transition-colors duration-200 ml-auto"
                    >
                      Paid
                      {sortField === 'paid' && (
                        <span className="text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 text-gray-200 font-semibold">
                    <button
                      onClick={() => handleSort('remaining')}
                      className="flex items-center gap-2 hover:text-white transition-colors duration-200 ml-auto"
                    >
                      Remaining
                      {sortField === 'remaining' && (
                        <span className="text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-center p-4 text-gray-200 font-semibold">Late Payments</th>
                  <th className="text-center p-4 text-gray-200 font-semibold">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 hover:text-white transition-colors duration-200 mx-auto"
                    >
                      Status
                      {sortField === 'status' && (
                        <span className="text-blue-400">
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
                    <tr
                      className="border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors duration-200"
                      onClick={() => toggleOpen(m.id)}
                    >
                      <td className="p-4 text-white font-medium">
                        <button
                          onClick={(e) => navigateToMember(m.id, e)}
                          className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors duration-200"
                        >
                          {m.name}
                        </button>
                      </td>
                      <td className="p-4 text-gray-300">{m.section}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">${m.totalPaid.toFixed(2)}</td>
                      <td className="p-4 text-right text-red-400 font-semibold">${m.remaining.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        {m.latePaymentsCount > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-300 font-bold border border-red-400/30">
                            {m.latePaymentsCount} late
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {m.status === 'paid' ? (
                          <span className="status-badge inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-500/20 text-green-300 font-bold border border-green-400/30">
                            Paid in Full
                          </span>
                        ) : m.status === 'partial' ? (
                          <span className="status-badge inline-flex items-center px-4 py-2 rounded-full text-sm bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-400/30">
                            Partial Payment
                          </span>
                        ) : (
                          <span className="status-badge inline-flex items-center px-4 py-2 rounded-full text-sm bg-red-500/20 text-red-300 font-bold border border-red-400/30">
                            Outstanding
                          </span>
                        )}
                      </td>
                    </tr>

                    {openMemberId === m.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-800/50 p-6 border-b border-gray-700">
                          <div className="bg-gray-700 rounded-xl p-4">
                            <PaymentTable 
                              payments={m.payments} 
                              paymentGroups={m.paymentGroups}
                              onUnassign={handleUnassign} 
                            />
                          </div>
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
              <div key={m.id} className="border-b border-gray-700 last:border-b-0">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors duration-200"
                  onClick={() => toggleOpen(m.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <button
                        onClick={(e) => navigateToMember(m.id, e)}
                        className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors duration-200 text-lg font-medium text-left"
                      >
                        {m.name}
                      </button>
                      <p className="text-gray-300 text-sm">{m.section}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">${m.totalPaid.toFixed(2)}</div>
                      <div className="text-red-400 font-semibold text-sm">${m.remaining.toFixed(2)} remaining</div>
                      {m.latePaymentsCount > 0 && (
                        <div className="text-red-300 text-xs mt-1">
                          {m.latePaymentsCount} late payment{m.latePaymentsCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {m.status === 'paid' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 font-bold border border-green-400/30">
                          Paid in Full
                        </span>
                      ) : m.status === 'partial' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-300 font-bold border border-yellow-400/30">
                          Partial Payment
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-300 font-bold border border-red-400/30">
                          Outstanding
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {openMemberId === m.id ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {openMemberId === m.id && (
                  <div className="bg-gray-800/50 p-4 border-t border-gray-700">
                    <div className="bg-gray-700 rounded-xl p-4">
                      <PaymentTable 
                        payments={m.payments} 
                        paymentGroups={m.paymentGroups}
                        onUnassign={handleUnassign} 
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
}