'use client';
import { useEffect, useState } from 'react';

export default function ReconcilePage() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selections, setSelections] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetch('/api/reconcile')
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments);
        setMembers(data.members);
      });
  }, []);

  const handleAssign = async (paymentId: string) => {
    const memberId = selections[paymentId];
    if (!memberId) return alert('Select a member first.');

    await fetch('/api/reconcile/assign', {
      method: 'POST',
      body: JSON.stringify({ paymentId, memberId }),
      headers: { 'Content-Type': 'application/json' },
    });

    // Remove from list
    setPayments(payments.filter(p => p.id !== paymentId));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧾 Unmatched Payments</h1>

      {payments.map((p: any) => (
        <div key={p.id} className="border rounded-md p-4 mb-4 bg-white shadow-sm">
          <p className="font-medium text-gray-800">
            💳 ${p.amountPaid.toFixed(2)} — {new Date(p.paymentDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Card: {p.cardLast4 || 'N/A'} &nbsp;|&nbsp; Name: {p.customerName || '—'}
          </p>

          <div className="mt-2 flex gap-4">
            <select
              className="border p-1 rounded"
              value={selections[p.id] || ''}
              onChange={(e) =>
                setSelections((prev) => ({ ...prev, [p.id]: e.target.value }))
              }
            >
              <option value="">Select member...</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} — {m.section}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleAssign(p.id)}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Assign
            </button>
          </div>
        </div>
      ))}

      {payments.length === 0 && (
        <p className="text-sm text-gray-500">🎉 All payments are assigned.</p>
      )}
    </div>
  );
}