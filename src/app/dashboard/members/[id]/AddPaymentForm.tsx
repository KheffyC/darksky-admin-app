// app/dashboard/members/[id]/AddPaymentForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddPaymentForm({ memberId }: { memberId: string }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`/api/members/${memberId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaid: Number(amount),
        paymentDate: date,
        notes,
      }),
    });

    if (res.ok) {
      setAmount('');
      setDate('');
      setNotes('');
      router.refresh();
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-600 p-8">
      <h3 className="text-2xl font-bold text-white mb-6">Add Manual Payment</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">Amount</label>
            <input
              required
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">Date</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-200 mb-2">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="Optional payment notes..."
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl border border-green-400/30"
        >
          Add Payment
        </button>
      </form>
    </div>
  );
}