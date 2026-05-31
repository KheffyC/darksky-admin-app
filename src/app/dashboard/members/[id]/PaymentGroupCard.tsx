'use client';
import React from 'react';
import { formatDisplayDate } from '@/lib/format-date';

interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  stripePaymentId: string | null;
  note: string | null;
  isLate: boolean;
}

interface PaymentSchedule {
  id: string;
  name: string;
  dueDate: string;
  amount: string;
}

interface PaymentGroup {
  scheduleName: string;
  schedule: PaymentSchedule | null;
  payments: Payment[];
}

interface Props {
  group: PaymentGroup;
}

export function PaymentGroupCard({ group }: Props) {
  // Calculate late status automatically based on payment date vs schedule due date
  const paymentsWithLateStatus = group.payments.map(payment => {
    let isLate = false;
    if (group.schedule && group.schedule.dueDate) {
      const paymentDate = new Date(payment.paymentDate);
      const dueDate = new Date(group.schedule.dueDate);
      isLate = paymentDate > dueDate;
    }
    return { ...payment, isLate };
  });

  const groupTotal = paymentsWithLateStatus.reduce((sum, p) => sum + p.amountPaid, 0);
  const lateCount = paymentsWithLateStatus.filter(p => p.isLate).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#d6dde5] bg-white">
      {/* Group Header */}
      <div className="border-b border-[#d6dde5] bg-[#f7f9fb] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold tracking-[-0.03em] text-[#2C3E50]">{group.scheduleName}</h3>
            {group.schedule && (
              <div className="space-x-4 text-sm text-[#788896]">
                <span>Due: {formatDisplayDate(group.schedule.dueDate, { year: 'numeric' })}</span>
                <span>Expected: ${parseFloat(group.schedule.amount).toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-800">${groupTotal.toFixed(2)}</div>
              <div className="text-xs text-[#788896]">{paymentsWithLateStatus.length} payment{paymentsWithLateStatus.length !== 1 ? 's' : ''}</div>
            </div>
            {lateCount > 0 && (
              <div className="rounded-full border border-rose-400 bg-rose-100 px-3 py-1 text-sm font-medium text-rose-900">
                {lateCount} late
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="divide-y divide-[#e8edf3]">
        {paymentsWithLateStatus.map((payment) => (
          <div key={payment.id} className="p-4 transition-colors duration-200 hover:bg-[#f7f9fb]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium text-[#2C3E50]">
                      {formatDisplayDate(payment.paymentDate, { year: 'numeric' })}
                  </div>
                  <div className="font-bold text-emerald-800">
                    ${payment.amountPaid.toFixed(2)}
                  </div>
                  {payment.isLate ? (
                    <span className="inline-flex items-center rounded-full border border-rose-400 bg-rose-100 px-2 py-1 text-xs font-bold text-rose-900">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900">
                      On Time
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {payment.stripePaymentId && (
                    <div className="font-mono text-xs text-[#788896]">
                      Stripe ID: {payment.stripePaymentId}
                    </div>
                  )}
                  {payment.note && (
                    <div className="text-sm text-[#2C3E50]">
                      <span className="text-[#788896]">Note: </span>
                      {payment.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-[#788896]">
                  {payment.stripePaymentId ? 'Stripe Payment' : 'Manual Payment'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
