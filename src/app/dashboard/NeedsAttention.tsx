'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NeedsAttention as NeedsAttentionData } from '@/lib/needs-attention';
import { formatShortDate, formatTime, toISODate } from '@/lib/dates';
import { useAuth } from '@/components/auth/PermissionGuard';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function dayLabel(date: string, today: string) {
  if (date === today) return 'Today';
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === toISODate(tomorrow)) return 'Tomorrow';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** The Home page list: the same items the morning push summarizes. */
export function NeedsAttention() {
  const { user } = useAuth();
  const [data, setData] = useState<NeedsAttentionData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/needs-attention')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const heading = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        {data ? ` · ${data.season} season` : ''}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Needs attention</h1>
    </div>
  );

  if (failed) {
    return (
      <section className="space-y-3">
        {heading}
        <p className="text-sm text-behind">Couldn&apos;t load the list. Refresh to try again.</p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="space-y-3">
        {heading}
        <p className="text-sm text-muted">Checking…</p>
      </section>
    );
  }

  const behind = data.missedPayments?.members ?? [];
  const shows = data.upcoming.filter((event) => event.type === 'show');
  const deadlines = data.upcoming.filter((event) => event.type !== 'show');
  const allClear = data.count === 0;

  return (
    <section className="space-y-3">
      {heading}

      {allClear ? (
        <div className="flex items-center gap-3 rounded-2xl border border-paid-line bg-paid-soft p-5">
          <CheckCircleIcon className="h-7 w-7 flex-none text-paid" />
          <div>
            <p className="font-semibold text-paid">All clear</p>
            <p className="text-sm text-paid">No missed payments, shows, tasks, or reimbursements this week.</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">The 9 AM push covers missed payments, shows, deadlines, and tasks from this list.</p>
      )}

      {behind.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-behind-line bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-behind">Missed payments</h2>
            <span className="rounded-full border border-behind-line bg-behind-soft px-2.5 py-0.5 text-xs font-semibold text-behind">
              {data.missedPayments!.latestSchedule.name} · due {formatShortDate(data.missedPayments!.latestSchedule.dueDate)}
            </span>
          </div>
          <ul className="divide-y divide-line">
            {behind.slice(0, 8).map((member) => (
              <li key={member.id}>
                <Link href={`/dashboard/members/${member.id}`} className="flex min-h-[48px] items-center justify-between gap-3 py-1.5">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{member.name}</span>
                    <span className="block text-xs text-muted">
                      Paid {currency.format(member.paid)} of {currency.format(member.expected)} due so far
                      {member.section ? ` · ${member.section}` : ''}
                    </span>
                  </span>
                  <span className="flex-none font-mono text-sm font-medium text-behind">{currency.format(member.shortBy)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {behind.length > 8 && <p className="text-xs text-muted">and {behind.length - 8} more</p>}
          <Link
            href={`/dashboard/payments?schedule=${data.missedPayments!.latestSchedule.id}`}
            className="inline-flex min-h-[40px] items-center rounded-full border border-line-strong px-4 text-sm font-semibold text-ink hover:border-ink"
          >
            Open in Payments
          </Link>
        </section>
      )}

      {shows.map((show) => (
        <Link key={show.id} href={`/dashboard/calendar/${show.id}`} className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Show · {dayLabel(show.date, data.today)}</p>
            <p className="mt-1 truncate text-lg font-extrabold">{show.title}</p>
            <p className="truncate text-sm text-neutral-300">
              {[show.location, show.startTime && `Call ${formatTime(show.startTime)}`].filter(Boolean).join(' · ') || 'Add the venue and call time'}
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 flex-none" />
        </Link>
      ))}

      {deadlines.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-ink">Deadlines this week</h2>
          <ul className="divide-y divide-line">
            {deadlines.map((event) => (
              <li key={event.id}>
                <Link href={`/dashboard/calendar/${event.id}`} className="flex min-h-[48px] items-center justify-between gap-3">
                  <span className="truncate font-semibold text-ink">{event.title}</span>
                  <span className="flex-none text-sm text-muted">{dayLabel(event.date, data.today)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.tasks.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink">Tasks due this week</h2>
            <Link href="/dashboard/projects" className="text-sm font-semibold text-ink">
              Projects
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {data.tasks.map((task) => (
              <li key={task.id} className="flex min-h-[48px] items-center gap-3 py-1.5">
                <span
                  title={task.ownerName ?? 'No owner'}
                  className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
                    task.ownerId === user?.id ? 'bg-ink text-white' : 'border-[1.5px] border-ink bg-white text-ink'
                  }`}
                >
                  {(task.ownerName ?? '–').charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{task.title}</span>
                  <span className="block truncate text-xs text-muted">{task.projectName}</span>
                </span>
                <span className={`flex-none text-sm ${task.overdue ? 'font-bold text-behind' : 'text-muted'}`}>
                  {task.overdue ? `Overdue · ${formatShortDate(task.dueDate)}` : dayLabel(task.dueDate, data.today)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.reimbursements.count > 0 && (
        <Link href="/dashboard/reimbursements" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 hover:border-ink">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink">Reimbursements owed</h2>
              <span className="font-mono text-base font-medium text-ink">{currency.format(data.reimbursements.total)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {data.reimbursements.count} receipt{data.reimbursements.count === 1 ? '' : 's'} ·{' '}
              {data.reimbursements.byPerson.map((person) => `${person.name} ${currency.format(person.total)}`).join(' · ')}
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 flex-none text-muted" />
        </Link>
      )}
    </section>
  );
}
