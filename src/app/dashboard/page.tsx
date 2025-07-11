'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PermissionGuard, useAuth } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/lib/permissions';
import { CSVExportButton } from '@/components/CSVExportButton';

export default function DashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, role, permissions } = useAuth();

  useEffect(() => {
    // Fetch report data from multiple sources
    Promise.all([
      fetch('/api/dashboard/summary').then(r => r.json()),
      fetch('/api/members/ledger').then(r => r.json()),
    ]).then(([summary, ledger]) => {
      setReportData({ summary, ledger });
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch report data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Loading dashboard...</p>
          </div>
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

  // Prepare CSV data
  const prepareCSVData = () => {
    if (!ledger || ledger.length === 0) return [];
    
    return ledger.map((member: any) => ({
      'Member Name': member.name || 'N/A',
      'Email': member.email || 'N/A',
      'Section': member.section || 'N/A',
      'Tuition Amount': `$${(member.tuitionAmount || 0).toFixed(2)}`,
      'Total Paid': `$${(member.totalPaid || 0).toFixed(2)}`,
      'Outstanding Balance': `$${(member.remaining || 0).toFixed(2)}`,
      'Payment Status': member.status || 'unknown',
      'Late Payments Count': member.latePaymentsCount || 0,
      'Collection Rate': member.totalPaid && member.remaining 
        ? `${Math.round((member.totalPaid / (member.totalPaid + member.remaining)) * 100)}%`
        : '0%'
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-lg sm:text-xl text-gray-300">
                You are logged in as <span className="capitalize font-medium text-blue-400">{role}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-400/30 capitalize">
                {role}
              </span>
              <PermissionGuard permission={PERMISSIONS.VIEW_FINANCIAL_REPORTS}>
                <div className="flex space-x-3">
                  <CSVExportButton
                    data={prepareCSVData()}
                    filename="darksky-financial-report"
                    onExportStart={() => console.log('Export started')}
                    onExportComplete={(success) => {
                      if (success) {
                        console.log('Export completed successfully');
                      } else {
                        console.error('Export failed');
                      }
                    }}
                  />
                  <button className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg">
                    Print Report
                  </button>
                </div>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <PermissionGuard permission={PERMISSIONS.VIEW_MEMBER_DETAILS}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ReportCard
              title="Total Members"
              value={totalMembers}
              color="blue"
              link="/dashboard/members"
            />
            <ReportCard
              title="Paid in Full"
              value={paidMembers}
              color="green"
            />
            <ReportCard
              title="Partial Payment"
              value={partialMembers}
              color="yellow"
            />
            <ReportCard
              title="No Payment"
              value={unpaidMembers}
              color="red"
            />
          </div>
        </PermissionGuard>

        {/* Financial Summary */}
        <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Financial Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Total Tuition Expected:</span>
                  <span className="font-semibold text-white text-base sm:text-lg">${(summary?.totalPaid + summary?.outstanding)?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Total Received:</span>
                  <span className="font-semibold text-green-400 text-base sm:text-lg">${summary?.totalPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm sm:text-base">Outstanding Balance:</span>
                  <span className="font-semibold text-red-400 text-base sm:text-lg">${summary?.outstanding?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium text-sm sm:text-base">Collection Rate:</span>
                    <span className="font-bold text-blue-400 text-lg sm:text-xl">
                      {summary ? Math.round((summary.totalPaid / (summary.totalPaid + summary.outstanding)) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Payment Status Breakdown</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-4"></div>
                    <span className="text-gray-300 text-sm sm:text-base">Paid in Full</span>
                  </div>
                  <span className="font-semibold text-white text-sm sm:text-base">{paidMembers} ({totalMembers ? Math.round((paidMembers / totalMembers) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-4"></div>
                    <span className="text-gray-300 text-sm sm:text-base">Partial Payment</span>
                  </div>
                  <span className="font-semibold text-white text-sm sm:text-base">{partialMembers} ({totalMembers ? Math.round((partialMembers / totalMembers) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-4"></div>
                    <span className="text-gray-300 text-sm sm:text-base">No Payment</span>
                  </div>
                  <span className="font-semibold text-white text-sm sm:text-base">{unpaidMembers} ({totalMembers ? Math.round((unpaidMembers / totalMembers) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>
        </PermissionGuard>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-700">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PermissionGuard permission={PERMISSIONS.VIEW_MEMBER_DETAILS}>
              <ActionCard
                href="/dashboard/members"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
                title="View Members"
                description="Manage member information"
                color="blue"
              />
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.VIEW_ALL_PAYMENTS}>
              <ActionCard
                href="/dashboard/ledger"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                title="View Ledger"
                description="Check payment statuses"
                color="green"
              />
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.PROCESS_PAYMENTS}>
              <ActionCard
                href="/dashboard/reconcile"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                title="Reconcile Payments"
                description="Match unassigned payments"
                color="purple"
              />
            </PermissionGuard>
            
            <PermissionGuard permission={PERMISSIONS.MANAGE_SETTINGS}>
              <ActionCard
                href="/dashboard/settings"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                title="Settings"
                description="System configuration"
                color="gray"
              />
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>
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

function ActionCard({
  href,
  icon,
  title,
  description,
  color,
  isButton = false
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'gray' | 'orange';
  isButton?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-400/30',
    green: 'bg-green-500/20 border-green-400/30',
    purple: 'bg-purple-500/20 border-purple-400/30',
    indigo: 'bg-indigo-500/20 border-indigo-400/30',
    gray: 'bg-gray-500/20 border-gray-400/30',
    orange: 'bg-orange-500/20 border-orange-400/30',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    indigo: 'text-indigo-400',
    gray: 'text-gray-400',
    orange: 'text-orange-400',
  };

  const CardContent = () => (
    <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl hover:border-gray-500 transition-all duration-300 text-left group shadow-xl hover:shadow-2xl hover:-translate-y-1">
      <div className={`w-12 h-12 sm:w-16 sm:h-16 ${colorClasses[color]} rounded-xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center border`}>
        <div className={iconColorClasses[color]}>
          {icon}
        </div>
      </div>
      <div className="font-bold text-white text-lg sm:text-xl mb-2 sm:mb-3">{title}</div>
      <div className="text-sm sm:text-base text-gray-300 font-medium">{description}</div>
    </div>
  );

  return isButton ? (
    <button onClick={() => alert('Feature coming soon!')}>
      <CardContent />
    </button>
  ) : (
    <Link href={href}>
      <CardContent />
    </Link>
  );
}