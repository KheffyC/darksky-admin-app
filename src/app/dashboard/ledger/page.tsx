'use client';
import React, { useEffect, useState } from 'react';
import PaymentTable from '@/components/PaymentTable';

export default function LedgerPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/members/ledger')
      .then(res => res.json())
      .then(setMembers);
  }, []);

  const toggleOpen = (id: string) => {
    setOpenMemberId(openMemberId === id ? null : id);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Member Ledger</h1>
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Section</th>
            <th className="text-right p-2">Paid</th>
            <th className="text-right p-2">Remaining</th>
            <th className="text-center p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <React.Fragment key={m.id}>
              <tr
                className="border-b cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOpen(m.id)}
              >
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.section}</td>
                <td className="p-2 text-right">${m.totalPaid.toFixed(2)}</td>
                <td className="p-2 text-right">${m.remaining.toFixed(2)}</td>
                <td className="p-2 text-center">
                  {m.status === 'paid'
                    ? '✅'
                    : m.status === 'partial'
                    ? '⚠️'
                    : '❌'}
                </td>
              </tr>

              {openMemberId === m.id && (
                <tr>
                  <td colSpan={5} className="bg-gray-50 p-4">
                    <PaymentTable payments={m.payments} onUnassign={handleUnassign} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}