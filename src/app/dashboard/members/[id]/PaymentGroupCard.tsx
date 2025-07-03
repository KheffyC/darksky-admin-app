'use client';
import React from 'react';

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
    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600 overflow-hidden">
      {/* Group Header */}
      <div className="p-4 bg-gradient-to-r from-gray-600 to-gray-700 border-b border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">{group.scheduleName}</h3>
            {group.schedule && (
              <div className="text-sm text-gray-300 space-x-4">
                <span>Due: {new Date(group.schedule.dueDate).toLocaleDateString()}</span>
                <span>Expected: ${parseFloat(group.schedule.amount).toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">${groupTotal.toFixed(2)}</div>
              <div className="text-xs text-gray-300">{paymentsWithLateStatus.length} payment{paymentsWithLateStatus.length !== 1 ? 's' : ''}</div>
            </div>
            {lateCount > 0 && (
              <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
                {lateCount} late
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="divide-y divide-gray-600">
        {paymentsWithLateStatus.map((payment) => (
          <div key={payment.id} className="p-4 hover:bg-gray-600/30 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-gray-300 font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </div>
                  <div className="text-green-400 font-bold">
                    ${payment.amountPaid.toFixed(2)}
                  </div>
                  {payment.isLate ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-red-500/20 text-red-300 border border-red-400/30">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-green-500/20 text-green-300 border border-green-400/30">
                      On Time
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {payment.stripePaymentId && (
                    <div className="text-gray-400 font-mono text-xs">
                      Stripe ID: {payment.stripePaymentId}
                    </div>
                  )}
                  {payment.note && (
                    <div className="text-gray-300 text-sm">
                      <span className="text-gray-400">Note: </span>
                      {payment.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-400">
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
