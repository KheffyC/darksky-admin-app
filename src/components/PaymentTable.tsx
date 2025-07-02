'use client';
import React from 'react';

interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  note?: string;
  customerName?: string;
  cardLast4?: string;
}

interface PaymentTableProps {
  payments: Payment[];
  onUnassign: (paymentId: string) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, onUnassign }) => {
  if (!payments.length) return <p className="text-base text-gray-300 font-medium">No payments recorded yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
            <th className="p-4 text-left text-gray-200 font-bold">Date</th>
            <th className="p-4 text-right text-gray-200 font-bold">Amount</th>
            <th className="p-4 text-left text-gray-200 font-bold">Method</th>
            <th className="p-4 text-left text-gray-200 font-bold">Customer</th>
            <th className="p-4 text-left text-gray-200 font-bold">Note</th>
            <th className="p-4 text-center text-gray-200 font-bold">Action</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
              <td className="p-4 text-gray-300 font-medium">{new Date(p.paymentDate).toLocaleDateString()}</td>
              <td className="p-4 text-right text-green-400 font-bold">${p.amountPaid.toFixed(2)}</td>
              <td className="p-4 text-gray-300 font-medium">
                {p.paymentMethod}
                {p.cardLast4 && ` (****${p.cardLast4})`}
              </td>
              <td className="p-4 text-gray-300 font-medium">{p.customerName || '—'}</td>
              <td className="p-4 text-gray-300 font-medium">{p.note || '—'}</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onUnassign(p.id)}
                  className="text-red-400 hover:text-red-300 font-bold px-3 py-1 rounded-lg hover:bg-red-900/30 transition-all duration-200"
                >
                  Unassign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;