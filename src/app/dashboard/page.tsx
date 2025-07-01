'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p className="p-6">Loading dashboard...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📊 Dark Sky Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card label="Total Members" value={data.totalMembers} />
        <Card label="Tuition Received" value={`$${data.totalPaid.toFixed(2)}`} />
        <Card label="Outstanding Balance" value={`$${data.outstanding.toFixed(2)}`} />
        <Card label="Members w/ No Payments" value={data.membersWithNoPayments} />
        <Card label="Next Payment Date" value={data.nextPaymentDue || '—'} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}