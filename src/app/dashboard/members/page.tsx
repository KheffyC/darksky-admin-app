'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AddMemberModal from '@/components/AddMemberModal';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [sortField, setSortField] = useState<'name' | 'section' | 'tuition' | 'age'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleMemberAdded = () => {
    fetchMembers(); // Refresh the list
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

  // Calculate age from birthday
  const calculateAge = (birthday: string | null): number | null => {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Get unique sections for filter dropdown
  const uniqueSections = [...new Set(members.map(m => m.section).filter(Boolean))].sort();

  // Filter and sort members
  const filteredAndSortedMembers = members
    .filter(member => {
      // Section filter
      if (sectionFilter && member.section !== sectionFilter) return false;
      
      // Fuzzy search across multiple fields
      if (searchTerm) {
        const searchableText = [
          member.firstName,
          member.lastName,
          member.email,
          member.section,
          `${member.firstName} ${member.lastName}`
        ].filter(Boolean).join(' ');
        
        return fuzzySearch(searchableText, searchTerm);
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'section':
          aValue = (a.section || '').toLowerCase();
          bValue = (b.section || '').toLowerCase();
          break;
        case 'tuition':
          aValue = a.tuitionAmount || 0;
          bValue = b.tuitionAmount || 0;
          break;
        case 'age':
          aValue = calculateAge(a.birthday) || 0;
          bValue = calculateAge(b.birthday) || 0;
          break;
        default:
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'name' | 'section' | 'tuition' | 'age') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 sm:mb-12 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Manage Members</h1>
            <p className="text-lg sm:text-xl text-gray-300">View and manage all member accounts</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-4 text-base sm:text-lg border border-blue-400/30"
          >
            Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600 shadow-xl">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+</span>
              </div>
            </div>
            <p className="text-white text-2xl font-bold mb-3">No members found</p>
            <p className="text-gray-300 text-lg font-medium">Add your first member to get started</p>
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
                      placeholder="Search by name, email, or section..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Section Filter */}
                <div className="lg:w-64">
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

                {/* Clear Filters */}
                {(searchTerm || sectionFilter) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSectionFilter('');
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
                </span>
                <span>
                  Sorted by {sortField} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-700">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                      >
                        Member
                        {sortField === 'name' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
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
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('tuition')}
                        className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                      >
                        Tuition
                        {sortField === 'tuition' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('age')}
                        className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                      >
                        Age
                        {sortField === 'age' && (
                          <span className="text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAndSortedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <Link 
                            href={`/dashboard/members/${member.id}`}
                            className="font-semibold text-white text-lg hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                          <p className="text-sm text-gray-400">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-gray-300">
                        {member.section || '—'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          member.contractSigned 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.contractSigned ? 'Contract Signed' : 'Pending Contract'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-white font-semibold">
                        ${member.tuitionAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-gray-300 font-medium">
                        {(() => {
                          const age = calculateAge(member.birthday);
                          return age !== null ? age.toString() : '--';
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredAndSortedMembers.map((member) => (
                <div key={member.id} className="border-b border-gray-700 last:border-b-0 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link 
                        href={`/dashboard/members/${member.id}`}
                        className="text-white font-semibold text-lg hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                      <p className="text-gray-400 text-sm">{member.email}</p>
                      {member.section && (
                        <p className="text-gray-300 text-sm mt-1">Section: {member.section}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${member.tuitionAmount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Age: {(() => {
                          const age = calculateAge(member.birthday);
                          return age !== null ? age.toString() : '--';
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      member.contractSigned 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                    }`}>
                      {member.contractSigned ? 'Contract Signed' : 'Pending Contract'}
                    </span>
                    
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold text-sm"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        <AddMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMemberAdded}
        />
      </div>
    </div>
  );
}
