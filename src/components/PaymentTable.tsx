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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const PaymentTable: React.FC<PaymentTableProps> = ({ payments, paymentGroups, onUnassign }) => {
  // If we have payment groups, show grouped view
  if (paymentGroups && paymentGroups.length > 0) {
    return (
      <div className="space-y-5">
        {paymentGroups.map((group) => {
          const groupTotal = group.payments.reduce((sum, p) => sum + p.amountPaid, 0);
          const lateCount = group.payments.filter((p) => p.isLate).length;
          const expected = Number(group.schedule?.amount || 0);
          const remaining = Math.max(0, expected - groupTotal);
          const isComplete = expected > 0 && groupTotal >= expected;

          return (
            <div key={group.schedule?.id || 'unassigned'} className="overflow-hidden rounded-2xl border border-neutral-300 bg-white">
              {/* Group Header */}
              <div className="border-b border-neutral-300 bg-neutral-100 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold tracking-[-0.03em] text-neutral-900 sm:text-lg">{group.scheduleName}</h3>
                    {group.schedule && (
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-600 sm:text-sm">
                        <span>Due {formatDate(group.schedule.dueDate)}</span>
                        <span>Expected {formatCurrency(expected)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <div className="rounded-xl border border-line bg-white px-3 py-2 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Collected</p>
                      <p className="font-mono text-sm font-semibold tabular-nums text-paid sm:text-base">{formatCurrency(groupTotal)}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Remaining</p>
                      <p className="font-mono text-sm font-semibold tabular-nums text-neutral-900 sm:text-base">{formatCurrency(remaining)}</p>
                    </div>
                    <div className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isComplete ? 'border-paid-line bg-paid-soft text-paid' : 'border-line bg-white text-muted'}`}>
                      {isComplete ? 'Paid' : 'Open'}
                    </div>
                    {lateCount > 0 && (
                      <div className="rounded-full border border-flag-line bg-flag-soft px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-flag">
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
  if (!payments.length) return <p className="text-base font-medium text-neutral-600">No payments recorded yet.</p>;

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
  if (!payments.length) return <p className="text-base font-medium text-neutral-600">No payments recorded yet.</p>;

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full overflow-hidden rounded-xl border border-neutral-300 bg-white text-sm">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-100">
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Date</th>
              <th className="p-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Amount</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Method</th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Details</th>
              <th className="p-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Status</th>
              <th className="p-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-neutral-200 text-neutral-800 transition-colors duration-150 hover:bg-neutral-100">
                <td className="p-3 font-medium text-neutral-900">{formatDate(p.paymentDate)}</td>
                <td className="p-3 text-right">
                  <span className="font-mono text-sm font-semibold tabular-nums text-ink">{formatCurrency(p.amountPaid)}</span>
                </td>
                <td className="p-3">
                  <span className="font-medium text-neutral-900">{p.paymentMethod}</span>
                  {p.cardLast4 && <span className="ml-1 text-neutral-600">****{p.cardLast4}</span>}
                </td>
                <td className="p-3">
                  <div className="space-y-0.5 text-xs">
                    <p className="text-neutral-800">{p.customerName || 'No customer name'}</p>
                    <p className="text-neutral-600">{p.note || 'No note'}</p>
                  </div>
                </td>
                <td className="p-3 text-center">
                  {p.isLate ? (
                    <span className="inline-flex items-center rounded-full border border-flag-line bg-flag-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-flag">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-paid-line bg-paid-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-paid">
                      On Time
                    </span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onUnassign(p.id)}
                    className="rounded-md border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-ink"
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
      <div className="space-y-3 md:hidden">
        {payments.map((p) => (
          <div key={p.id} className="rounded-xl border border-neutral-300 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs text-neutral-600">
                  <span>{formatDate(p.paymentDate)}</span>
                  {p.isLate ? (
                    <span className="inline-flex items-center rounded-full border border-flag-line bg-flag-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-flag">
                      Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-paid-line bg-paid-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-paid">
                      On Time
                    </span>
                  )}
                </div>
                <div className="font-mono text-lg font-semibold tabular-nums text-ink">
                  {formatCurrency(p.amountPaid)}
                </div>
              </div>
              <button
                onClick={() => onUnassign(p.id)}
                className="rounded-md border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-ink"
              >
                Unassign
              </button>
            </div>

            <div className="grid gap-1.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-[0.2em] text-neutral-600">Method</span>
                <span className="text-neutral-900">
                  {p.paymentMethod}
                  {p.cardLast4 && ` (****${p.cardLast4})`}
                </span>
              </div>
              {p.customerName && (
                <div className="flex items-center justify-between gap-3">
                  <span className="uppercase tracking-[0.2em] text-neutral-600">Customer</span>
                  <span className="text-right text-neutral-900">{p.customerName}</span>
                </div>
              )}
              {p.note && (
                <div className="flex items-start justify-between gap-3">
                  <span className="uppercase tracking-[0.2em] text-neutral-600">Note</span>
                  <span className="text-right text-neutral-800">{p.note}</span>
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