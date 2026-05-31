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

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCompactCurrency(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  return `$${compactFormatter.format(normalized)}`;
}

function formatPercent(value: number) {
  return `${Math.round(Number.isFinite(value) ? value : 0)}%`;
}

function formatDueDate(dateValue?: string) {
  if (!dateValue) {
    return 'No scheduled due date';
  }

  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
      router.push('/dashboard/ledger');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-[#d6dde5] bg-white px-10 py-12 text-center backdrop-blur">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
          <p className="text-base font-medium text-[#2C3E50]">Building the latest finance snapshot...</p>
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
  const hasUpcomingSchedule = Boolean(upcomingSchedule);
  const nextSchedule = upcomingSchedule ?? sortedSchedules[0];

  const exposureMembers = ledger.filter((member) => toNumber(member.remaining) > 0);

  const outstandingCount = exposureMembers.length;
  const outstandingRate = totalMembers > 0 ? (outstandingCount / totalMembers) * 100 : 0;

  const topOutstandingMembers = ledger
    .filter((member) => toNumber(member.remaining) > 0)
    .sort((left, right) => toNumber(right.remaining) - toNumber(left.remaining))
    .slice(0, 5);
  const highestBalance = Math.max(...topOutstandingMembers.map((member) => toNumber(member.remaining)), 0);
  const behindOverallCount = ledger.filter((member) => toNumber(member.remaining) > 0).length;

  const collectionMix = [
    {
      label: 'Collected',
      value: totalPaid,
      tone: 'bg-emerald-600',
      rail: 'bg-emerald-100',
      cardBorder: 'border-emerald-300',
    },
    {
      label: 'Outstanding',
      value: outstanding,
      tone: 'bg-amber-400',
      rail: 'bg-amber-100',
      cardBorder: 'border-amber-300',
    },
  ];

  const memberHealth = [
    {
      label: 'Paid in full',
      value: paidMembers,
      tone: 'bg-emerald-600',
      rail: 'bg-emerald-100',
      cardBorder: 'border-emerald-300',
    },
    {
      label: 'Outstanding',
      value: outstandingMembers,
      tone: 'bg-rose-400',
      rail: 'bg-rose-100',
      cardBorder: 'border-rose-300',
    },
  ];

  const collectionMilestones = [
    {
      label: 'Tuition target',
      value: expectedRevenue,
      caption: 'Total tuition expected for the full season',
      tone: 'text-[#2C3E50]',
      barClass: 'bg-slate-300',
    },
    {
      label: 'Revenue captured',
      value: totalPaid,
      caption: `${formatPercent(collectionRate)} of expected tuition booked`,
      tone: 'text-emerald-700',
      barClass: 'bg-emerald-400',
    },
    {
      label: 'Open balance',
      value: outstanding,
      caption: `${behindOverallCount} members are currently behind on total tuition`,
      tone: 'text-amber-700',
      barClass: 'bg-amber-400',
    },
  ];

  const maxMilestoneValue = Math.max(...collectionMilestones.map((item) => item.value), 1);

  return (
    <>
      <div className="hidden bg-white p-8 text-black print:block">
        <div className="mb-8 border-b pb-4 text-center">
          <h1 className="mb-2 text-3xl font-bold">Dark Sky Percussion</h1>
          <h2 className="text-xl text-gray-600">Financial Report</h2>
          <p className="mt-2 text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
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
                <span className="font-bold text-green-700">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-red-700">{formatCurrency(outstanding)}</span>
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
                <span className="font-bold text-green-700">{paidMembers}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-bold text-red-700">{outstandingMembers}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 border-b pb-2 text-lg font-bold">Member Details</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
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
                <tr key={member.id} className="border-b border-gray-200">
                  <td className="py-2 font-medium">{member.name}</td>
                  <td className="py-2">{member.section}</td>
                  <td className="py-2 text-right">{formatCurrency(toNumber(member.tuitionAmount))}</td>
                  <td className="py-2 text-right text-green-700">{formatCurrency(toNumber(member.totalPaid))}</td>
                  <td className="py-2 text-right text-red-700">{formatCurrency(toNumber(member.remaining))}</td>
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
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/90">
                    Financial command center
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#2C3E50] sm:text-4xl lg:text-5xl">
                      Income Tracker for Indoor
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-[#788896] sm:text-base">
                      Monitor collections, isolate open balances, and keep the next payment cycle visible from one focused finance dashboard.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#788896]">
                    <span className="rounded-full border border-[#d6dde5] bg-white px-3 py-1.5">
                      Signed in as <span className="font-semibold text-[#2C3E50]">{user?.name}</span>
                    </span>
                    <span className="rounded-full border border-[#cfd8e3] bg-[#eef3f8] px-3 py-1.5 capitalize text-[#0D47A1]">
                      {role} access
                    </span>
                    <span className="rounded-full border border-[#d6dde5] bg-white px-3 py-1.5">
                      Next due: <span className="font-semibold text-[#2C3E50]">{nextSchedule?.name ?? 'No scheduled payment'}</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="w-full max-w-xl lg:max-w-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">
                    Member lookup
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search members, sections, or balances"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-2xl border border-[#d6dde5] bg-white px-4 py-3 pl-11 text-sm text-[#2C3E50] placeholder:text-[#788896] focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]"
                    />
                    <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#788896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  accent="emerald"
                />
                <MetricCard
                  label="Collected to date"
                  value={formatCurrency(totalPaid)}
                  trend={`${formatPercent(collectionRate)} collection rate`}
                  accent="sky"
                />
                <MetricCard
                  label="Outstanding balance"
                  value={formatCurrency(outstanding)}
                  trend={`${outstandingCount} members still open`}
                  accent="amber"
                />
                <MetricCard
                  label="Outstanding member rate"
                  value={formatPercent(outstandingRate)}
                  trend="Share of roster with open balances"
                  accent="rose"
                />
              </div>

              <div className="2xl:hidden">
                <ActionQueuePanel highestBalance={highestBalance} members={topOutstandingMembers} />
              </div>

              <div className="flex flex-col gap-5">
                <PanelCard
                  noPadding
                  eyebrow="Revenue analytics"
                  title="Cash position and collection mix"
                  description="A quick read on how much tuition is already booked versus what still needs follow-up."
                >
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.7fr)]">
                    <div className="py-2">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">Cash flow</p>
                          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#2C3E50]">
                            {formatCurrency(totalPaid)}
                          </p>
                        </div>
                        <div className="rounded-2xl px-3 py-2 text-right">
                          <p className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-900">Goal hit</p>
                          <p className="mt-1 text-lg font-semibold text-emerald-950">{formatPercent(collectionRate)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-[20px] px-4 py-4">
                        {collectionMilestones.map((milestone) => {
                          const rawHeight = (milestone.value / maxMilestoneValue) * 100;
                          const height = Math.min(100, Math.max(rawHeight, 14));

                          return (
                            <div key={milestone.label} className="flex min-w-0 flex-1 flex-col gap-3">
                              <div className="flex h-40 items-end overflow-hidden rounded-t-[18px] p-2">
                                <div
                                  className={`w-full rounded-[14px] ${milestone.barClass}`}
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                              <div className="space-y-1">
                                <p className={`text-sm font-semibold ${milestone.tone}`}>{formatCompactCurrency(milestone.value)}</p>
                                <p className="text-xs font-medium text-[#2C3E50]">{milestone.label}</p>
                                <p className="text-xs leading-5 text-[#788896]">{milestone.caption}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {collectionMix.map((item) => {
                        const width = expectedRevenue > 0 ? (item.value / expectedRevenue) * 100 : 0;

                        return (
                          <div key={item.label} className={`rounded-[24px] border ${item.cardBorder} ${item.rail} p-5`}>
                            <div className="mb-3 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-[#2C3E50]">{item.label}</p>
                                <p className="text-xs text-[#788896]">{formatPercent(width)} of total tuition</p>
                              </div>
                              <p className="text-lg font-semibold text-[#2C3E50]">{formatCurrency(item.value)}</p>
                            </div>
                            <div className="h-3 rounded-full bg-[#dfe6ed]">
                              <div className={`h-3 rounded-full ${item.tone}`} style={{ width: `${Math.max(width, 8)}%` }}></div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="rounded-[24px] border border-[#d6dde5] bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">Next collection window</p>
                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-2xl font-semibold text-[#2C3E50]">
                              {hasUpcomingSchedule ? nextSchedule?.name : 'Collection closed'}
                            </p>
                            <p className="mt-1 text-sm text-[#788896]">
                              {hasUpcomingSchedule
                                ? `Due ${formatDueDate(nextSchedule?.dueDate)}`
                                : 'Final payment schedule has passed'}
                            </p>
                          </div>
                          {hasUpcomingSchedule ? (
                            <Link
                              href={nextSchedule ? `/dashboard/payments?schedule=${nextSchedule.id}` : '/dashboard/payments'}
                              className="rounded-full border border-[#d6dde5] bg-[#f7f9fb] px-4 py-2 text-sm font-semibold text-[#2C3E50] transition hover:border-emerald-400 hover:bg-emerald-400 hover:text-emerald-950"
                            >
                              Open schedule
                            </Link>
                          ) : (
                            <span className="rounded-full border border-[#d6dde5] bg-[#f7f9fb] px-4 py-2 text-sm font-semibold text-[#788896]">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PanelCard>

                <PanelCard
                  noPadding
                  eyebrow="Operations pulse"
                  title="Member payment health"
                  description=""
                >
                  <div className="space-y-5">
                    {memberHealth.map((item) => {
                      const width = totalMembers > 0 ? (item.value / totalMembers) * 100 : 0;

                      return (
                        <div key={item.label} className={`rounded-[22px] border ${item.cardBorder} ${item.rail} p-4`}>
                          <div className="mb-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-[#2C3E50]">{item.label}</p>
                              <p className="text-xs text-[#788896]">{item.value} members</p>
                            </div>
                            <p className="text-sm font-semibold text-[#2C3E50]">{formatPercent(width)}</p>
                          </div>
                          <div className="h-2.5 rounded-full bg-[#dfe6ed]">
                            <div className={`h-2.5 rounded-full ${item.tone}`} style={{ width: `${Math.max(width, item.value > 0 ? 12 : 0)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="rounded-[22px] border border-red-300 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Outstanding tuition exposure</p>
                          <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{outstandingCount}</p>
                          <p className="mt-1 text-sm text-[#788896]">
                            Members with outstanding tuition balance
                          </p>
                        </div>
                        <Link
                          href="/dashboard/ledger"
                          className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-[#2C3E50] transition hover:border-[#f38d68] hover:bg-[#fff8f4]"
                        >
                          Review list
                        </Link>
                      </div>
                    </div>
                  </div>
                </PanelCard>
              </div>
            </div>

            <div className="space-y-5">
              <div className="hidden 2xl:block">
                <ActionQueuePanel highestBalance={highestBalance} members={topOutstandingMembers} />
              </div>

              <PanelCard
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
                    href="/dashboard/ledger"
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
  accent,
}: {
  label: string;
  value: string;
  trend: string;
  accent: 'emerald' | 'sky' | 'amber' | 'rose';
}) {
  const accentClasses = {
    emerald: 'bg-emerald-200 border-emerald-300 text-black',
    sky: 'bg-sky-200 border-sky-300 text-black',
    amber: 'bg-amber-200 border-amber-300 text-black',
    rose: 'bg-rose-200 border-rose-300 text-black',
  };

  return (
    <div className={`rounded-[24px] border ${accentClasses[accent]} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-3 text-sm">{trend}</p>
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-[#788896]">{description}</p>
      </div>
      <hr className="mb-5 border-[#d6dde5]" />
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
      className="group rounded-[22px] border border-[#d6dde5] bg-white p-4 transition hover:border-[#f38d68] hover:bg-[#fff4ee]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2C3E50]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#788896]">{description}</p>
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
                    <p className="text-sm font-semibold text-[#2C3E50]">{member.name}</p>
                    <p className="text-xs text-[#788896]">
                      {member.section || 'Unassigned section'} • Rank {index + 1}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#f38d68]">{formatCurrency(balance)}</p>
                </div>
                <div className="h-2 rounded-full bg-[#dfe6ed]">
                  <div className="h-2 rounded-full bg-[#f38d68]" style={{ width: `${Math.max(width, balance > 0 ? 10 : 0)}%` }}></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[20px] border border-emerald-500 bg-emerald-400 p-4 text-sm text-emerald-950">
            No outstanding balances were found in the current ledger.
          </div>
        )}
      </div>
    </PanelCard>
  );
}
