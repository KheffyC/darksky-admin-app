'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Loading reports...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">Reports & Analytics</h1>
            <p className="text-xl text-gray-300">Financial insights and member statistics</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg">
              Export CSV
            </button>
            <button className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg">
              Print Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ReportCard
            title="Total Members"
            value={totalMembers}
            color="blue"
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

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Financial Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Tuition Expected:</span>
                <span className="font-semibold text-white text-lg">${(summary?.totalPaid + summary?.outstanding)?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Received:</span>
                <span className="font-semibold text-green-400 text-lg">${summary?.totalPaid?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Outstanding Balance:</span>
                <span className="font-semibold text-red-400 text-lg">${summary?.outstanding?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Collection Rate:</span>
                  <span className="font-bold text-blue-400 text-xl">
                    {summary ? Math.round((summary.totalPaid / (summary.totalPaid + summary.outstanding)) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Payment Status Breakdown</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-4"></div>
                  <span className="text-gray-300">Paid in Full</span>
                </div>
                <span className="font-semibold text-white">{paidMembers} ({totalMembers ? Math.round((paidMembers / totalMembers) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-4"></div>
                  <span className="text-gray-300">Partial Payment</span>
                </div>
                <span className="font-semibold text-white">{partialMembers} ({totalMembers ? Math.round((partialMembers / totalMembers) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-4"></div>
                  <span className="text-gray-300">No Payment</span>
                </div>
                <span className="font-semibold text-white">{unpaidMembers} ({totalMembers ? Math.round((unpaidMembers / totalMembers) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/dashboard/ledger"
              className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl hover:border-gray-500 transition-all duration-300 text-left block group shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center border border-blue-400/30">
                <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
              </div>
              <div className="font-bold text-white text-xl mb-3">View Member Ledger</div>
              <div className="text-base text-gray-300 font-medium">See all member payment statuses</div>
            </Link>
            <Link 
              href="/dashboard/reconcile"
              className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl hover:border-gray-500 transition-all duration-300 text-left block group shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center border border-green-400/30">
                <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
              </div>
              <div className="font-bold text-white text-xl mb-3">Reconcile Payments</div>
              <div className="text-base text-gray-300 font-medium">Match unassigned payments</div>
            </Link>
            <button className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-2xl hover:border-gray-500 transition-all duration-300 text-left group shadow-xl hover:shadow-2xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center border border-purple-400/30">
                <div className="w-8 h-8 bg-purple-500 rounded-lg"></div>
              </div>
              <div className="font-bold text-white text-xl mb-3">Send Reminders</div>
              <div className="text-base text-gray-300 font-medium">Email outstanding balance notices</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ 
  title, 
  value, 
  color 
}: { 
  title: string; 
  value: number; 
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[color]} shadow-xl w-16 h-16 flex items-center justify-center`}>
          <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
        </div>
      </div>
      <p className="card-label text-gray-200 mb-3">{title}</p>
      <p className="card-value text-white">{value}</p>
    </div>
  );
}
