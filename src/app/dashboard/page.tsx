'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeedsAttention } from './NeedsAttention';

type Summary = {
  totalPaid?: number | string;
  outstanding?: number | string;
};

type PaymentGroup = {
  schedule?: {
    id?: string;
  };
};

type LedgerMember = {
  id: string;
  name: string;
  section?: string;
  tuitionAmount?: number | string;
  totalPaid?: number | string;
  remaining?: number | string;
  status?: 'paid' | 'partial' | 'unpaid' | string;
  paymentGroups?: PaymentGroup[];
};

type PaymentSchedule = {
  id: string;
  name: string;
  dueDate: string;
};

type ReportData = {
  summary?: Summary;
  ledger?: LedgerMember[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value: number) {
  return `${Math.round(Number.isFinite(value) ? value : 0)}%`;
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function DashboardPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/summary')
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
      fetch('/api/members/ledger')
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []),
      fetch('/api/payment-schedules?active=true')
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []),
    ])
      .then(([summary, ledger, schedules]) => {
        setReportData({ summary: summary ?? undefined, ledger: Array.isArray(ledger) ? ledger : [] });
        setPaymentSchedules(schedules);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch report data:', error);
        setLoading(false);
      });
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/payments?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-line bg-white px-10 py-12 text-center backdrop-blur">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-line border-t-ink"></div>
          <p className="text-base font-medium text-black">Building the latest finance snapshot...</p>
        </div>
      </div>
    );
  }

  const summary = reportData?.summary;
  const ledger = reportData?.ledger ?? [];
  const ledgerPaidTotal = ledger.reduce((sum, member) => sum + toNumber(member.totalPaid), 0);
  const ledgerOutstandingTotal = ledger.reduce((sum, member) => sum + Math.max(toNumber(member.remaining), 0), 0);
  const totalPaid = summary?.totalPaid !== undefined ? toNumber(summary.totalPaid) : ledgerPaidTotal;
  const outstanding = summary?.outstanding !== undefined ? toNumber(summary.outstanding) : ledgerOutstandingTotal;
  const totalMembers = ledger.length;
  const paidMembers = ledger.filter((member) => toNumber(member.remaining) <= 0).length;
  const outstandingMembers = ledger.filter((member) => toNumber(member.remaining) > 0).length;
  const expectedRevenue = totalPaid + outstanding;
  const collectionRate = expectedRevenue > 0 ? (totalPaid / expectedRevenue) * 100 : 0;

  const sortedSchedules = [...paymentSchedules].sort(
    (left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
  );
  const upcomingSchedule = sortedSchedules.find((schedule) => new Date(schedule.dueDate) >= new Date());
  const nextSchedule = upcomingSchedule ?? sortedSchedules[0];

  const exposureMembers = ledger.filter((member) => toNumber(member.remaining) > 0);

  const outstandingCount = exposureMembers.length;
  const outstandingRate = totalMembers > 0 ? (outstandingCount / totalMembers) * 100 : 0;

  return (
    <>
      <div className="hidden bg-white p-8 text-black print:block">
        <div className="mb-8 border-b pb-4 text-center">
          <h1 className="mb-2 text-3xl font-bold">Dark Sky Percussion</h1>
          <h2 className="text-xl text-neutral-600">Financial Report</h2>
          <p className="mt-2 text-sm text-neutral-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-4 border-b pb-2 text-lg font-bold">Financial Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Tuition Expected:</span>
                <span className="font-bold">{formatCurrency(expectedRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Received:</span>
                <span className="font-bold text-paid">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold">{formatCurrency(outstanding)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Collection Rate:</span>
                <span className="font-bold">{formatPercent(collectionRate)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 border-b pb-2 text-lg font-bold">Member Balances</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Members:</span>
                <span className="font-bold">{totalMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid in Full:</span>
                <span className="font-bold text-paid">{paidMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold">{outstandingMembers}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 border-b pb-2 text-lg font-bold">Member Details</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-300">
                <th className="py-2">Name</th>
                <th className="py-2">Section</th>
                <th className="py-2 text-right">Tuition</th>
                <th className="py-2 text-right">Paid</th>
                <th className="py-2 text-right">Remaining</th>
                <th className="py-2 text-center">Balance State</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((member) => (
                <tr key={member.id} className="border-b border-neutral-200">
                  <td className="py-2 font-medium">{member.name}</td>
                  <td className="py-2">{member.section}</td>
                  <td className="py-2 text-right">{formatCurrency(toNumber(member.tuitionAmount))}</td>
                  <td className="py-2 text-right">{formatCurrency(toNumber(member.totalPaid))}</td>
                  <td className="py-2 text-right">{formatCurrency(toNumber(member.remaining))}</td>
                  <td className="py-2 text-center">{toNumber(member.remaining) > 0 ? 'Outstanding' : 'Paid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 print:hidden">
        <NeedsAttention />

        <form onSubmit={handleSearch}>
          <label htmlFor="member-lookup" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Member lookup
          </label>
          <div className="relative">
            <input
              id="member-lookup"
              type="text"
              placeholder="Search members, sections, or balances"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-h-[48px] w-full rounded-2xl border border-line bg-white px-4 py-3 pl-11 text-base text-black placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Tuition this season</h2>
            {nextSchedule && <span className="text-xs text-muted">Next due: {nextSchedule.name}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Expected" value={formatCurrency(expectedRevenue)} trend="Season tuition target" />
            <MetricCard label="Collected" value={formatCurrency(totalPaid)} trend={`${formatPercent(collectionRate)} collected`} tone="paid" />
            <MetricCard label="Outstanding" value={formatCurrency(outstanding)} trend={`${outstandingCount} members open`} />
            <MetricCard label="Open rate" value={formatPercent(outstandingRate)} trend="Of the roster" />
          </div>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  trend,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  tone?: 'paid' | 'behind' | 'flag';
}) {
  const toneClasses = {
    paid: { dot: 'bg-paid-solid', value: 'text-paid' },
    behind: { dot: 'bg-behind-solid', value: 'text-behind' },
    flag: { dot: 'bg-flag-solid', value: 'text-flag' },
  };
  const toneClass = tone ? toneClasses[tone] : null;

  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {toneClass && <span className={`h-2 w-2 rounded-full ${toneClass.dot}`} />}
        {label}
      </p>
      <p className={`mt-4 text-3xl font-semibold tracking-[-0.03em] ${toneClass?.value ?? 'text-ink'}`}>{value}</p>
      <p className="mt-3 text-sm text-muted">{trend}</p>
    </div>
  );
}
