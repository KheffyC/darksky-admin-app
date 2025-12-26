'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PermissionGuard, useAuth } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';

export default function DashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [paymentSchedules, setPaymentSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, role, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch report data from multiple sources
    Promise.all([
      fetch('/api/dashboard/summary').then(r => r.json()),
      fetch('/api/members/ledger').then(r => r.json()),
      fetch('/api/payment-schedules?active=true').then(r => r.json()).catch(() => []),
    ]).then(([summary, ledger, schedules]) => {
      setReportData({ summary, ledger });
      setPaymentSchedules(schedules);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch report data:', err);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to ledger with search param (would need to implement search param handling in ledger page)
      // For now, just go to ledger, user can type there. 
      // Ideally: router.push(`/dashboard/ledger?search=${encodeURIComponent(searchQuery)}`);
      // Since ledger page doesn't support URL search params yet, we'll just go there.
      // But let's add support for it in the future.
      router.push('/dashboard/ledger');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { summary, ledger } = reportData || {};

  // Calculate additional metrics
  const totalMembers = ledger?.length || 0;
  const paidMembers = ledger?.filter((m: any) => m.status === 'paid').length || 0;
  const partialMembers = ledger?.filter((m: any) => m.status === 'partial').length || 0;
  const unpaidMembers = ledger?.filter((m: any) => m.status === 'unpaid').length || 0;

  // Calculate missed payment rate for most recent schedule
  const sortedSchedules = [...paymentSchedules].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  const mostRecentSchedule = sortedSchedules.find(s => new Date(s.dueDate) <= new Date());
  
  const missedPaymentCount = mostRecentSchedule && ledger 
    ? ledger.filter((m: any) => !m.paymentGroups?.some((g: any) => g.schedule?.id === mostRecentSchedule.id)).length
    : 0;
    
  const missedPaymentRate = totalMembers > 0 ? Math.round((missedPaymentCount / totalMembers) * 100) : 0;

  return (
    <>
      {/* Print View */}
      <div className="hidden print:block bg-white text-black p-8">
        <div className="mb-8 text-center border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">Dark Sky Percussion</h1>
          <h2 className="text-xl text-gray-600">Financial Report</h2>
          <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Financial Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Tuition Expected:</span>
                <span className="font-bold">${(summary?.totalPaid + summary?.outstanding)?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Received:</span>
                <span className="font-bold text-green-700">${summary?.totalPaid?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-red-700">${summary?.outstanding?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>Collection Rate:</span>
                <span className="font-bold">
                  {summary ? Math.round((summary.totalPaid / (summary.totalPaid + summary.outstanding)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Member Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Members:</span>
                <span className="font-bold">{totalMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid in Full:</span>
                <span className="font-bold text-green-700">{paidMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>Partial Payment:</span>
                <span className="font-bold text-yellow-700">{partialMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>No Payment:</span>
                <span className="font-bold text-red-700">{unpaidMembers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div>
          <h3 className="text-lg font-bold mb-4 border-b pb-2">Member Details</h3>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="py-2">Name</th>
                <th className="py-2">Section</th>
                <th className="py-2 text-right">Tuition</th>
                <th className="py-2 text-right">Paid</th>
                <th className="py-2 text-right">Remaining</th>
                <th className="py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger?.map((member: any) => (
                <tr key={member.id} className="border-b border-gray-200">
                  <td className="py-2 font-medium">{member.name}</td>
                  <td className="py-2">{member.section}</td>
                  <td className="py-2 text-right">${member.tuitionAmount?.toFixed(2)}</td>
                  <td className="py-2 text-right text-green-700">${member.totalPaid?.toFixed(2)}</td>
                  <td className="py-2 text-right text-red-700">${member.remaining?.toFixed(2)}</td>
                  <td className="py-2 text-center capitalize">{member.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen View */}
      <div className="py-8 sm:py-12 print:hidden">
        {/* Mobile Dashboard View */}
        <div className="md:hidden space-y-6 mb-8">
          {/* Welcome & Search */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-400 text-sm">Here&apos;s what&apos;s happening today.</p>
            </div>
            
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Find a member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          {/* Vertical Stats Stack */}
          <div className="flex flex-col gap-4">
            {/* Next Payment Card */}
            <Link 
              href={paymentSchedules.length > 0 ? `/dashboard/ledger?schedule=${paymentSchedules[0].id}` : '/dashboard/ledger'}
              className="w-full bg-gradient-to-br from-blue-900/50 to-gray-800 p-4 rounded-2xl border border-blue-500/30 shadow-lg active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full">Upcoming</span>
              </div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Next Payment Due</p>
              {paymentSchedules.length > 0 ? (
                <div className="mt-1">
                  <p className="text-white text-lg font-bold">
                    {new Date(paymentSchedules[0].dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-gray-400 text-sm">{paymentSchedules[0].name}</p>
                </div>
              ) : (
                <p className="text-white text-lg font-bold mt-1">No upcoming payments</p>
              )}
            </Link>

            {/* Missed Payment Card */}
            <Link 
              href={mostRecentSchedule ? `/dashboard/ledger?schedule=${mostRecentSchedule.id}&scheduleStatus=unpaid` : '/dashboard/ledger'}
              className="w-full bg-gradient-to-br from-orange-900/50 to-gray-800 p-4 rounded-2xl border border-orange-500/30 shadow-lg active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-orange-300 bg-orange-500/10 px-2 py-1 rounded-full">Attention</span>
              </div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Missed Recent Payment</p>
              <div className="mt-1">
                <p className="text-white text-lg font-bold">
                  {missedPaymentRate}%
                </p>
                <p className="text-gray-400 text-sm">of members ({mostRecentSchedule?.name || 'Unknown'})</p>
              </div>
            </Link>
          </div>

          {/* Actionable Alerts */}
          {ledger?.filter((m: any) => m.latePaymentsCount > 0).length > 0 && (
            <Link href="/dashboard/ledger?late=true" className="block bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between active:bg-red-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Late Payments</p>
                  <p className="text-red-300 text-sm">
                    {ledger.filter((m: any) => m.latePaymentsCount > 0).length} members have overdue payments
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Desktop Welcome Header */}
        <div className="hidden md:block bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-6 sm:p-8 mb-8">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-lg text-gray-300">
                You are logged in as <span className="capitalize font-medium text-blue-400">{role}</span>
              </p>
            </div>
            
            <div className="flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Find a member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner transition-all"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Next Payment Card */}
          <Link 
            href={paymentSchedules.length > 0 ? `/dashboard/ledger?schedule=${paymentSchedules[0].id}` : '/dashboard/ledger'}
            className="bg-gradient-to-br from-blue-900/50 to-gray-800 p-8 rounded-2xl border border-blue-500/30 shadow-lg hover:scale-[1.01] transition-transform group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full">Upcoming</span>
              </div>
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Next Payment Due</h3>
              {paymentSchedules.length > 0 ? (
                <div>
                  <p className="text-white text-4xl font-bold mb-2">
                    {new Date(paymentSchedules[0].dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-gray-400 text-lg">{paymentSchedules[0].name}</p>
                </div>
              ) : (
                <p className="text-white text-3xl font-bold mt-1">No upcoming payments</p>
              )}
            </div>
          </Link>

          {/* Missed Payment Card */}
          <Link 
            href={mostRecentSchedule ? `/dashboard/ledger?schedule=${mostRecentSchedule.id}&scheduleStatus=unpaid` : '/dashboard/ledger'}
            className="bg-gradient-to-br from-orange-900/50 to-gray-800 p-8 rounded-2xl border border-orange-500/30 shadow-lg hover:scale-[1.01] transition-transform group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-32 h-32 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-orange-300 bg-orange-500/10 px-3 py-1 rounded-full">Attention</span>
              </div>
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Missed Recent Payment</h3>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-white text-4xl font-bold mb-2">
                    {missedPaymentRate}%
                  </p>
                  <p className="text-gray-400 text-lg">of members</p>
                </div>
                <p className="text-gray-400 text-lg">{mostRecentSchedule?.name || 'Unknown'}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Actionable Alerts (Desktop) */}
        {ledger?.filter((m: any) => m.latePaymentsCount > 0).length > 0 && (
          <div className="hidden md:block mb-8">
            <Link href="/dashboard/ledger?late=true" className="block bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between hover:bg-red-500/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-lg font-semibold">Late Payments Alert</p>
                  <p className="text-red-300">
                    {ledger.filter((m: any) => m.latePaymentsCount > 0).length} members have overdue payments that require attention
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-red-400 font-medium group-hover:translate-x-1 transition-transform">
                View Details
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function ReportCard({ 
  title, 
  value, 
  color,
  link
}: { 
  title: string; 
  value: number; 
  color: 'blue' | 'green' | 'yellow' | 'red';
  link?: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
  };

  const CardContent = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 sm:p-4 rounded-xl bg-gradient-to-r ${colorClasses[color]} shadow-xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center`}>
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg"></div>
        </div>
      </div>
      <p className="text-gray-200 mb-3 text-sm sm:text-base">{title}</p>
      <p className="text-white text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
  );

  return link ? (
    <Link href={link}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
}
