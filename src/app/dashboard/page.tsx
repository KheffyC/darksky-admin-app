'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Dashboard</h1>
          <p className="text-xl text-gray-300">Dark Sky Admin Overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Card label="Total Members" value={data.totalMembers} color="blue" />
          <Card label="Tuition Received" value={`$${data.totalPaid.toFixed(2)}`} color="green" />
          <Card label="Outstanding Balance" value={`$${data.outstanding.toFixed(2)}`} color="yellow" />
          <Card label="Members w/ No Payments" value={data.membersWithNoPayments} color="red" />
          <Card label="Next Payment Date" value={data.nextPaymentDue || '—'} color="purple" />
        </div>
      </div>
    </div>
  );
}

function Card({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: string | number; 
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-green-500 to-green-600 shadow-green-500/30',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[color]} shadow-xl w-16 h-16 flex items-center justify-center`}>
          <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
        </div>
      </div>
      <p className="card-label text-gray-200 mb-3">{label}</p>
      <p className="card-value text-white">{value}</p>
    </div>
  );
}