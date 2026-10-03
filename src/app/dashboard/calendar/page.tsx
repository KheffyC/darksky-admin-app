'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatTime, toISODate, todayISO } from '@/lib/dates';
import { EventBasicsSheet, EVENT_TYPE_LABELS, type EventBasics } from './EventBasicsSheet';
import { LinkedCalendarBar } from './LinkedCalendarBar';

type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
};
type PaymentDue = { id: string; name: string; dueDate: string };
type CalendarData = { season: string; events: CalendarEvent[]; paymentDueDates: PaymentDue[] };

// One list for the day view and "Coming up": events plus payment due dates
type Item =
  | { kind: 'event'; date: string; event: CalendarEvent }
  | { kind: 'payment'; date: string; payment: PaymentDue };

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function monthDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days: (string | null)[] = Array(first.getDay()).fill(null);
  const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  for (let day = 1; day <= count; day += 1) {
    days.push(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day)));
  }
  while (days.length % 7) days.push(null);
  return days;
}

export default function CalendarPage() {
  const router = useRouter();
  const [data, setData] = useState<CalendarData | null>(null);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<EventBasics | null>(null);
  const today = todayISO();

  const load = useCallback(async () => {
    const response = await fetch('/api/events');
    if (response.ok) setData(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo<Item[]>(() => {
    if (!data) return [];
    return [
      ...data.events.map((event) => ({ kind: 'event' as const, date: event.date, event })),
      ...data.paymentDueDates.map((payment) => ({ kind: 'payment' as const, date: payment.dueDate, payment })),
    ].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const byDate = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) map.set(item.date, [...(map.get(item.date) ?? []), item]);
    return map;
  }, [items]);

  const listed = selected ? byDate.get(selected) ?? [] : items.filter((item) => item.date >= today).slice(0, 8);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const shiftMonth = (delta: number) => {
    setSelected(null);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const openAdd = (date: string) =>
    setAdding({ type: 'show', title: '', date, startTime: '', endTime: '', location: '', address: '' });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{data ? `${data.season} season` : 'Season'}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Calendar</h1>
        </div>
        <button
          type="button"
          onClick={() => openAdd(selected ?? today)}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-hover"
        >
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>

      <LinkedCalendarBar onSynced={load} />

      <section className="rounded-2xl border border-line bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-full p-2.5 text-ink hover:bg-wash">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold text-ink">{monthLabel}</h2>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-full p-2.5 text-ink hover:bg-wash">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-bold text-muted">
          {WEEKDAYS.map((day, index) => (
            <div key={index} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {monthDays(cursor).map((date, index) => {
            if (!date) return <div key={index} />;
            const dayItems = byDate.get(date) ?? [];
            const hasShow = dayItems.some((item) => item.kind === 'event' && item.event.type === 'show');
            const isSelected = selected === date;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(isSelected ? null : date)}
                aria-pressed={isSelected}
                aria-label={`${date}${dayItems.length ? `, ${dayItems.length} item${dayItems.length === 1 ? '' : 's'}` : ''}`}
                className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sm ${
                  hasShow ? 'bg-ink font-bold text-white' : 'text-ink hover:bg-wash'
                } ${isSelected ? 'ring-2 ring-ink ring-offset-2' : date === today ? 'ring-[1.5px] ring-inset ring-ink' : ''}`}
              >
                <span>{Number(date.slice(8))}</span>
                <span className="flex h-1.5 gap-0.5">
                  {dayItems
                    .filter((item) => !(item.kind === 'event' && item.event.type === 'show'))
                    .slice(0, 3)
                    .map((item, dotIndex) => (
                      <span key={dotIndex} className={`h-1.5 w-1.5 rounded-full ${dotClass(item)}`} />
                    ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <Legend swatch="h-3 w-3 rounded bg-ink" label="Show" />
          <Legend swatch="h-1.5 w-1.5 rounded-full bg-ink" label="Rehearsal" />
          <Legend swatch="h-1.5 w-1.5 rounded-full bg-behind-solid" label="Payment due" />
          <Legend swatch="h-1.5 w-1.5 rounded-full border-[1.5px] border-ink" label="Deadline" />
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
          {selected ? new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Coming up'}
        </h2>
        {selected && (
          <button type="button" onClick={() => openAdd(selected)} className="text-sm font-semibold text-ink underline">
            Add on this day
          </button>
        )}
      </div>

      {!data ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : listed.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-center text-sm text-muted">
          {selected ? 'Nothing on this day.' : 'Nothing coming up this season. Add the first show.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {listed.map((item) => (
            <li key={item.kind === 'event' ? item.event.id : `pay-${item.payment.id}`}>
              <ItemRow item={item} />
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <EventBasicsSheet
          title="Add to calendar"
          initial={adding}
          onClose={() => setAdding(null)}
          onSave={async (fields) => {
            const response = await fetch('/api/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fields),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Could not save');
            setAdding(null);
            // Shows have a day-of page to fill in next
            if (result.type === 'show') {
              router.push(`/dashboard/calendar/${result.id}`);
            } else {
              await load();
            }
          }}
        />
      )}
    </div>
  );
}

function dotClass(item: Item) {
  if (item.kind === 'payment') return 'bg-behind-solid';
  if (item.event.type === 'deadline') return 'border-[1.5px] border-ink';
  if (item.event.type === 'other') return 'bg-subtle';
  return 'bg-ink';
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={swatch} />
      {label}
    </span>
  );
}

function ItemRow({ item }: { item: Item }) {
  const day = new Date(`${item.date}T12:00:00`);
  const dateBlock = (
    <div className="flex w-11 flex-none flex-col items-center">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {day.toLocaleDateString(undefined, { weekday: 'short' })}
      </span>
      <span className="text-xl font-extrabold text-ink">{day.getDate()}</span>
    </div>
  );

  if (item.kind === 'payment') {
    return (
      <Link
        href={`/dashboard/payments?schedule=${item.payment.id}`}
        className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:border-ink"
      >
        {dateBlock}
        <span className="w-[3px] self-stretch rounded bg-behind-solid" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{item.payment.name} due</p>
          <p className="text-sm text-muted">Payment deadline</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 flex-none text-muted" />
      </Link>
    );
  }

  const { event } = item;
  const isShow = event.type === 'show';
  const meta = [
    EVENT_TYPE_LABELS[event.type],
    event.startTime && `${isShow ? 'Call ' : ''}${formatTime(event.startTime)}${event.endTime ? `–${formatTime(event.endTime)}` : ''}`,
    event.location,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/dashboard/calendar/${event.id}`}
      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
        isShow ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'
      }`}
    >
      {isShow ? (
        <div className="flex w-11 flex-none flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {day.toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
          <span className="text-xl font-extrabold">{day.getDate()}</span>
        </div>
      ) : (
        dateBlock
      )}
      <span className={`w-[3px] self-stretch rounded ${isShow ? 'bg-white' : event.type === 'deadline' ? 'bg-subtle' : 'bg-ink'}`} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${isShow ? 'text-white' : 'text-ink'}`}>{event.title}</p>
        <p className={`truncate text-sm ${isShow ? 'text-neutral-300' : 'text-muted'}`}>{meta}</p>
      </div>
      <ChevronRightIcon className={`h-4 w-4 flex-none ${isShow ? 'text-white' : 'text-muted'}`} />
    </Link>
  );
}
