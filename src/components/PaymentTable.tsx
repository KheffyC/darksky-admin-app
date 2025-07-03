'use client';
import React from 'react';

interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  isLate: boolean;
  note?: string;
  customerName?: string;
  cardLast4?: string;
  schedule?: {
    id: string;
    name: string;
    dueDate: string;
    amount: string;
  } | null;
}

interface PaymentGroup {
  scheduleName: string;
  schedule: {
    id: string;
    name: string;
    dueDate: string;
    amount: string;
  } | null;
  payments: Payment[];
}

interface PaymentTableProps {
  payments: Payment[];
  paymentGroups?: PaymentGroup[];
  onUnassign: (paymentId: string) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, paymentGroups, onUnassign }) => {
  // If we have payment groups, show grouped view
  if (paymentGroups && paymentGroups.length > 0) {
    return (
      <div className="space-y-6">
        {paymentGroups.map((group, index) => {
          const groupTotal = group.payments.reduce((sum, p) => sum + p.amountPaid, 0);
          const lateCount = group.payments.filter(p => p.isLate).length;
          
          return (
            <div key={group.schedule?.id || 'unassigned'} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600 overflow-hidden">
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
                      <div className="text-xs text-gray-300">{group.payments.length} payment{group.payments.length !== 1 ? 's' : ''}</div>
                    </div>
                    {lateCount > 0 && (
                      <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-400/30">
                        {lateCount} late
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Payments */}
              <div className="p-4">
                <PaymentList 
                  payments={group.payments} 
                  onUnassign={onUnassign}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback to regular payment list
  if (!payments.length) return <p className="text-base text-gray-300 font-medium">No payments recorded yet.</p>;

  return (
    <PaymentList 
      payments={payments} 
      onUnassign={onUnassign}
    />
  );
};

// Separate component for rendering payment lists
const PaymentList: React.FC<{
  payments: Payment[];
  onUnassign: (paymentId: string) => void;
}> = ({ payments, onUnassign }) => {
  if (!payments.length) return <p className="text-base text-gray-300 font-medium">No payments recorded yet.</p>;

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm bg-gray-800 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
              <th className="p-4 text-left text-gray-200 font-bold">Date</th>
              <th className="p-4 text-right text-gray-200 font-bold">Amount</th>
              <th className="p-4 text-left text-gray-200 font-bold">Method</th>
              <th className="p-4 text-left text-gray-200 font-bold">Customer</th>
              <th className="p-4 text-left text-gray-200 font-bold">Note</th>
              <th className="p-4 text-center text-gray-200 font-bold">Status</th>
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
                  {p.isLate ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-red-500/20 text-red-300 border border-red-400/30">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-green-500/20 text-green-300 border border-green-400/30">
                      On Time
                    </span>
                  )}
                </td>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {payments.map((p) => (
          <div key={p.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-gray-300 font-medium text-sm flex items-center gap-2">
                  {new Date(p.paymentDate).toLocaleDateString()}
                  {p.isLate ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-red-500/20 text-red-300 border border-red-400/30">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full font-bold bg-green-500/20 text-green-300 border border-green-400/30">
                      On Time
                    </span>
                  )}
                </div>
                <div className="text-green-400 font-bold text-lg">
                  ${p.amountPaid.toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => onUnassign(p.id)}
                className="text-red-400 hover:text-red-300 font-bold px-3 py-2 rounded-lg hover:bg-red-900/30 transition-all duration-200 text-sm"
              >
                Unassign
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Method:</span>
                <span className="text-gray-300">
                  {p.paymentMethod}
                  {p.cardLast4 && ` (****${p.cardLast4})`}
                </span>
              </div>
              
              {p.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-gray-300">{p.customerName}</span>
                </div>
              )}
              
              {p.note && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Note:</span>
                  <span className="text-gray-300">{p.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PaymentTable;