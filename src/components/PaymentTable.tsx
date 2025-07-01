'use client';
import React from 'react';

interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  note?: string;
}

interface PaymentTableProps {
  payments: Payment[];
  onUnassign: (paymentId: string) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, onUnassign }) => {
  if (!payments.length) return <p className="text-sm italic text-gray-500">No payments yet.</p>;

  return (
    <table className="w-full text-sm border mt-2">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-right">Amount</th>
          <th className="p-2 text-left">Method</th>
          <th className="p-2 text-left">Note</th>
          <th className="p-2 text-center">Action</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id} className="border-b">
            <td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
            <td className="p-2 text-right">${p.amountPaid.toFixed(2)}</td>
            <td className="p-2">{p.paymentMethod}</td>
            <td className="p-2">{p.note || '-'}</td>
            <td className="p-2 text-center">
              <button
                onClick={() => onUnassign(p.id)}
                className="text-red-500 hover:underline"
              >
                Unassign
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PaymentTable;