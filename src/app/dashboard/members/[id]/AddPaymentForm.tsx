// app/dashboard/members/[id]/AddPaymentForm.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';

export function AddPaymentForm({ memberId }: { memberId: string }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardLast4, setCardLast4] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const router = useRouter();

  // Load payment schedules on component mount
  React.useEffect(() => {
    const loadPaymentSchedules = async () => {
      try {
        const response = await fetch("/api/payment-schedules?active=true");
        if (response.ok) {
          const schedules = await response.json();
          setPaymentSchedules(schedules);
        }
      } catch (error) {
        console.error('Failed to load payment schedules:', error);
      }
    };
    
    loadPaymentSchedules();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check if payment is late based on schedule
    let isLate = false;
    if (scheduleId && scheduleId !== "none") {
      const schedule = paymentSchedules.find((s: any) => s.id === scheduleId);
      if (schedule) {
        const paymentDate = new Date(date);
        const dueDate = new Date(schedule.dueDate);
        isLate = paymentDate > dueDate;
      }
    }

    const res = await fetch(`/api/members/${memberId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountPaid: Number(amount),
        paymentDate: date,
        note: notes,
        paymentMethod,
        cardLast4: paymentMethod === 'card' ? cardLast4 : '',
        scheduleId: (scheduleId && scheduleId !== "none") ? scheduleId : null,
        isLate,
      }),
    });

    if (res.ok) {
      setAmount('');
      setDate('');
      setNotes('');
      setPaymentMethod('card');
      setCardLast4('');
      setScheduleId('');
      router.refresh();
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-600 p-8">
      <h3 className="text-2xl font-bold text-white mb-6">Add Manual Payment</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">Payment Method</label>
            <CustomSelect
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                // Clear cardLast4 when payment method changes away from card
                if (value !== 'card') {
                  setCardLast4('');
                }
              }}
              options={[
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'cash', label: 'Cash' },
                { value: 'donation', label: 'Donation' },
                { value: 'gift', label: 'Gift' },
              ]}
              placeholder="Select payment method..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">Payment Schedule</label>
            <CustomSelect
              value={scheduleId || "none"}
              onValueChange={(value) => setScheduleId(value === "none" ? "" : value)}
              options={[
                { value: "none", label: "No payment schedule" },
                ...paymentSchedules.map((schedule: any) => ({
                  value: schedule.id,
                  label: `${schedule.name} - Due ${new Date(schedule.dueDate).toLocaleDateString()}`
                }))
              ]}
              placeholder="Select payment schedule..."
            />
          </div>
          {paymentMethod === 'card' && (
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Card Last 4 Digits</label>
              <input
                type="text"
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                title="Please enter the last 4 digits of the card"
              />
            </div>
          )}
          <div className={paymentMethod === 'card' ? "sm:col-span-2 lg:col-span-5" : "sm:col-span-2 lg:col-span-1"}>
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