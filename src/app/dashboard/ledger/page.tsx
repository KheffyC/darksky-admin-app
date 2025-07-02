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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Member Ledger</h1>
          <p className="text-xl text-gray-300">Track all member payments and balances</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
                  <th className="text-left p-4 text-gray-200 font-semibold">Name</th>
                  <th className="text-left p-4 text-gray-200 font-semibold">Section</th>
                  <th className="text-right p-4 text-gray-200 font-semibold">Paid</th>
                  <th className="text-right p-4 text-gray-200 font-semibold">Remaining</th>
                  <th className="text-center p-4 text-gray-200 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <React.Fragment key={m.id}>
                    <tr
                      className="border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors duration-200"
                      onClick={() => toggleOpen(m.id)}
                    >
                      <td className="p-4 text-white font-medium">{m.name}</td>
                      <td className="p-4 text-gray-300">{m.section}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">${m.totalPaid.toFixed(2)}</td>
                      <td className="p-4 text-right text-red-400 font-semibold">${m.remaining.toFixed(2)}</td>
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
                        <td colSpan={5} className="bg-gray-800/50 p-6 border-b border-gray-700">
                          <div className="bg-gray-700 rounded-xl p-4">
                            <PaymentTable payments={m.payments} onUnassign={handleUnassign} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}