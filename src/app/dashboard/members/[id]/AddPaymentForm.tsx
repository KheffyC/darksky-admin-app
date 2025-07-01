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
    <form onSubmit={handleSubmit} className="space-y-4 mt-8 bg-gray-50 p-4 rounded-md">
      <h3 className="text-lg font-medium">➕ Add Manual Payment</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Amount</label>
          <input
            required
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Payment
      </button>
    </form>
  );
}