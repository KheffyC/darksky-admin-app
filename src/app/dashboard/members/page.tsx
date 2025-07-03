'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AddMemberModal from '@/components/AddMemberModal';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-700">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Tuition
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-white text-lg">
                            {member.firstName} {member.lastName}
                          </p>
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
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-4">
                        <Link
                          href={`/dashboard/members/${member.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold"
                        >
                          View
                        </Link>
                        <button className="text-gray-400 hover:text-gray-300 transition-colors duration-200 font-semibold">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {members.map((member) => (
                <div key={member.id} className="border-b border-gray-700 last:border-b-0 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-gray-400 text-sm">{member.email}</p>
                      {member.section && (
                        <p className="text-gray-300 text-sm mt-1">Section: {member.section}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${member.tuitionAmount?.toFixed(2) || '0.00'}
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
                    
                    <div className="flex gap-3">
                      <Link
                        href={`/dashboard/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold text-sm"
                      >
                        View
                      </Link>
                      <button className="text-gray-400 hover:text-gray-300 transition-colors duration-200 font-semibold text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
