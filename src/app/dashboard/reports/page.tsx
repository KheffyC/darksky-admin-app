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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📈 Reports & Analytics</h1>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Export CSV
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
            Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard
          title="Total Members"
          value={totalMembers}
          icon="👥"
          color="blue"
        />
        <ReportCard
          title="Paid in Full"
          value={paidMembers}
          icon="✅"
          color="green"
        />
        <ReportCard
          title="Partial Payment"
          value={partialMembers}
          icon="⚠️"
          color="yellow"
        />
        <ReportCard
          title="No Payment"
          value={unpaidMembers}
          icon="❌"
          color="red"
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">💰 Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tuition Expected:</span>
              <span className="font-semibold">${(summary?.totalPaid + summary?.outstanding)?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Received:</span>
              <span className="font-semibold text-green-600">${summary?.totalPaid?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding Balance:</span>
              <span className="font-semibold text-red-600">${summary?.outstanding?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-gray-800 font-medium">Collection Rate:</span>
                <span className="font-bold text-blue-600">
                  {summary ? Math.round((summary.totalPaid / (summary.totalPaid + summary.outstanding)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">📊 Payment Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span>Paid in Full</span>
              </div>
              <span className="font-semibold">{paidMembers} ({totalMembers ? Math.round((paidMembers / totalMembers) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span>Partial Payment</span>
              </div>
              <span className="font-semibold">{partialMembers} ({totalMembers ? Math.round((partialMembers / totalMembers) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span>No Payment</span>
              </div>
              <span className="font-semibold">{unpaidMembers} ({totalMembers ? Math.round((unpaidMembers / totalMembers) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">📅 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/ledger"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left block"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">View Member Ledger</div>
            <div className="text-sm text-gray-500">See all member payment statuses</div>
          </Link>
          <Link 
            href="/dashboard/reconcile"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left block"
          >
            <div className="text-2xl mb-2">🧾</div>
            <div className="font-medium">Reconcile Payments</div>
            <div className="text-sm text-gray-500">Match unassigned payments</div>
          </Link>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
            <div className="text-2xl mb-2">📤</div>
            <div className="font-medium">Send Reminders</div>
            <div className="text-sm text-gray-500">Email outstanding balance notices</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: string; 
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
