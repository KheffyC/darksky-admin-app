'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/PermissionGuard';

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
  const { user, role } = useAuth();
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

  const topOutstandingMembers = ledger
    .filter((member) => toNumber(member.remaining) > 0)
    .sort((left, right) => toNumber(right.remaining) - toNumber(left.remaining))
    .slice(0, 5);
  const highestBalance = Math.max(...topOutstandingMembers.map((member) => toNumber(member.remaining)), 0);

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

      <div className="relative print:hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 "></div>

        <div className="relative grid gap-8 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
            <div className="space-y-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Financial command center
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl lg:text-5xl">
                      Income Tracker for Indoor
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                      Monitor collections, isolate open balances, and keep the next payment cycle visible from one focused finance dashboard.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="rounded-full border border-line bg-white px-3 py-1.5">
                      Signed in as <span className="font-semibold text-black">{user?.name}</span>
                    </span>
                    <span className="rounded-full border border-line-strong bg-canvas px-3 py-1.5 capitalize text-ink">
                      {role} access
                    </span>
                    <span className="rounded-full border border-line bg-white px-3 py-1.5">
                      Next due: <span className="font-semibold text-black">{nextSchedule?.name ?? 'No scheduled payment'}</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="w-full max-w-xl lg:max-w-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Member lookup
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search members, sections, or balances"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 pl-11 text-sm text-black placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                    />
                    <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </form>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Expected revenue"
                  value={formatCurrency(expectedRevenue)}
                  trend="Season tuition target"
                />
                <MetricCard
                  label="Collected to date"
                  value={formatCurrency(totalPaid)}
                  trend={`${formatPercent(collectionRate)} collection rate`}
                  tone="paid"
                />
                <MetricCard
                  label="Outstanding balance"
                  value={formatCurrency(outstanding)}
                  trend={`${outstandingCount} members still open`}
                />
                <MetricCard
                  label="Outstanding member rate"
                  value={formatPercent(outstandingRate)}
                  trend="Share of roster with open balances"
                />
              </div>

              <div className="2xl:hidden">
                <ActionQueuePanel highestBalance={highestBalance} members={topOutstandingMembers} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="hidden 2xl:block">
                <ActionQueuePanel highestBalance={highestBalance} members={topOutstandingMembers} />
              </div>

              <PanelCard
                noPadding
                eyebrow="Quick actions"
                title=""
                description=""
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <QuickAction
                    href="/dashboard/payments"
                    title="Payments workspace"
                    description="Review schedules, collect payments, and clear unmatched transactions."
                  />
                  <QuickAction
                    href="/dashboard/payments"
                    title="Member ledger"
                    description="Inspect balances, payment history, and per-member financial detail."
                  />
                  <QuickAction
                    href="/dashboard/settings"
                    title="Settings and integrations"
                    description="Manage finance controls, roles, and connected data flows."
                  />
                </div>
              </PanelCard>
            </div>
          </div>

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

function PanelCard({
  eyebrow,
  title,
  description,
  noPadding = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-[28px] ${noPadding ? '' : 'p-5 sm:p-6'}`}>
      <div className="mb-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      <hr className="mb-5 border-line" />
      {children}
    </section>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-line bg-white p-4 transition hover:border-ink hover:bg-wash"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-black">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>

      </div>
    </Link>
  );
}

function ActionQueuePanel({
  highestBalance,
  members,
}: {
  highestBalance: number;
  members: LedgerMember[];
}) {
  return (
    <PanelCard
      noPadding
      eyebrow="Action queue"
      title="Priority follow-up"
      description="The largest outstanding balances are surfaced first so the team can act quickly."
    >
      <div className="space-y-3">
        {members.length > 0 ? (
          members.map((member, index) => {
            const balance = toNumber(member.remaining);
            const width = highestBalance > 0 ? (balance / highestBalance) * 100 : 0;

            return (
              <div key={member.id} className="rounded-[20px]">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black">{member.name}</p>
                    <p className="text-xs text-muted">
                      {member.section || 'Unassigned section'} • Rank {index + 1}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(balance)}</p>
                </div>
                <div className="h-2 rounded-full bg-canvas">
                  <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max(width, balance > 0 ? 10 : 0)}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-paid-line bg-paid-soft p-4 text-sm text-paid">
            No outstanding balances were found in the current ledger.
          </div>
        )}
      </div>
    </PanelCard>
  );
}
