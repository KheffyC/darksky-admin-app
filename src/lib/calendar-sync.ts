import IcalExpander from 'ical-expander';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarSources, eventFiles, events, links } from '@/db/schema';
import { getCurrentSeasonSettings } from '@/lib/current-season';
import { addDays, ORG_TIME_ZONE, pacificToday } from '@/lib/needs-attention';

export const GOOGLE_SOURCE_ID = 'google';

// Events this far back and ahead are kept in step with the feed
const PAST_DAYS = 30;
const FUTURE_DAYS = 400;

export type SyncResult = { added: number; updated: number; removed: number; kept: number };

/** Best guess at the event type from its name; only used when an event is first imported. */
export function guessEventType(title: string) {
  if (/rehears|practice|camp|sectional|run[- ]?through|clinic/i.test(title)) return 'rehearsal';
  if (/deadline|registration|due\b|submit/i.test(title)) return 'deadline';
  if (/show|competition|contest|championship|regional|finals?\b|prelim|semi|exhibition|performance|\bwgi\b|circuit|power regional/i.test(title)) return 'show';
  return 'other';
}

/** Only https feeds; Google's secret address looks like https://calendar.google.com/calendar/ical/…/basic.ics */
export function validateIcsUrl(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return { error: 'Paste the calendar’s secret iCal address' };
  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^webcal:/i, 'https:'));
  } catch {
    return { error: 'That is not a valid URL' };
  }
  if (url.protocol !== 'https:') return { error: 'The address must start with https://' };
  return { url: url.toString() };
}

/** "Central HS, 100 Main St, Springfield" → venue "Central HS", address = the whole string */
function splitLocation(location: string | null) {
  const value = location?.replace(/\\n/g, ' ').trim();
  if (!value) return { location: null, address: null };
  const [first] = value.split(',');
  return { location: first.trim() || null, address: value.includes(',') ? value : null };
}

const pacificParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: ORG_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function toPacific(date: Date) {
  const parts = Object.fromEntries(pacificParts.formatToParts(date).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

type IcalTime = { isDate: boolean; toJSDate(): Date; toString(): string };
type ParsedOccurrence = {
  uid: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  address: string | null;
};

/** Turns the feed into one row per occurrence, with dates and times in Pacific time. */
export function parseFeed(ics: string, from: Date, to: Date): ParsedOccurrence[] {
  const expander = new IcalExpander({ ics, maxIterations: 2000, skipInvalidDates: true });
  const { events: singles, occurrences } = expander.between(from, to);

  const toRow = (
    uid: string,
    summary: string | undefined,
    rawLocation: string | undefined,
    start: IcalTime,
    end: IcalTime | undefined,
  ): ParsedOccurrence => {
    const place = splitLocation(rawLocation ?? null);
    if (start.isDate) {
      // All-day: the iCal date is the calendar day itself, no timezone shift
      const day = start.toString().slice(0, 10);
      return { uid, title: summary?.trim() || 'Untitled', date: day, startTime: null, endTime: null, ...place };
    }
    const begins = toPacific(start.toJSDate());
    const ends = end ? toPacific(end.toJSDate()) : null;
    return {
      uid,
      title: summary?.trim() || 'Untitled',
      date: begins.date,
      startTime: begins.time,
      endTime: ends && ends.time !== begins.time ? ends.time : null,
      ...place,
    };
  };

  const rows: ParsedOccurrence[] = [];
  for (const event of singles) {
    // A moved occurrence of a repeating event keeps the slot it replaced as its identity
    const uid = event.recurrenceId ? `${event.uid}@${event.recurrenceId.toJSDate().toISOString()}` : event.uid;
    rows.push(toRow(uid, event.summary, event.location, event.startDate, event.endDate));
  }
  for (const occurrence of occurrences) {
    const uid = `${occurrence.item.uid}@${occurrence.recurrenceId.toJSDate().toISOString()}`;
    rows.push(toRow(uid, occurrence.item.summary, occurrence.item.location, occurrence.startDate, occurrence.endDate));
  }
  return rows;
}

/**
 * Pulls the linked Google calendar into the active season. Google decides each
 * event's name, date, times, and place; the type and all show-day details are
 * the app's and are never overwritten. Events deleted in Google are removed,
 * unless someone already added details to them, in which case they're flagged.
 */
export async function syncGoogleCalendar(): Promise<SyncResult> {
  const [source] = await db.select().from(calendarSources).where(eq(calendarSources.id, GOOGLE_SOURCE_ID)).limit(1);
  if (!source) throw new Error('No Google calendar is connected');

  const season = (await getCurrentSeasonSettings())?.season;
  if (!season) throw new Error('Set an active season before syncing');

  try {
    const response = await fetch(source.icsUrl, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        response.status === 404 || response.status === 403
          ? 'Google rejected the address. If it was reset, paste the new secret address.'
          : `Google returned ${response.status}`,
      );
    }
    const ics = await response.text();
    if (!ics.includes('BEGIN:VCALENDAR')) throw new Error('That address did not return a calendar');

    const today = pacificToday().date;
    const windowStart = addDays(today, -PAST_DAYS);
    const windowEnd = addDays(today, FUTURE_DAYS);
    const feed = parseFeed(ics, new Date(`${windowStart}T00:00:00Z`), new Date(`${windowEnd}T23:59:59Z`)).filter(
      (row) => row.date >= windowStart && row.date <= windowEnd,
    );

    const existing = await db
      .select()
      .from(events)
      .where(and(eq(events.source, 'google'), gte(events.date, windowStart), lte(events.date, windowEnd)));
    const byUid = new Map(existing.map((event) => [event.externalUid, event]));
    const now = new Date().toISOString();
    const result: SyncResult = { added: 0, updated: 0, removed: 0, kept: 0 };

    for (const row of feed) {
      const match = byUid.get(row.uid);
      const fromGoogle = {
        title: row.title,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        location: row.location,
        address: row.address,
      };
      if (match) {
        byUid.delete(row.uid);
        const changed =
          match.removedFromSource || (Object.keys(fromGoogle) as (keyof typeof fromGoogle)[]).some((key) => match[key] !== fromGoogle[key]);
        if (changed) {
          await db.update(events).set({ ...fromGoogle, removedFromSource: false, updatedAt: now }).where(eq(events.id, match.id));
          result.updated += 1;
        }
      } else {
        await db
          .insert(events)
          .values({
            id: crypto.randomUUID(),
            season,
            type: guessEventType(row.title),
            ...fromGoogle,
            source: 'google',
            externalUid: row.uid,
            createdAt: now,
            updatedAt: now,
          })
          // Already imported but dated outside the window until now (moved in Google)
          .onConflictDoUpdate({ target: events.externalUid, set: { ...fromGoogle, removedFromSource: false, updatedAt: now } });
        result.added += 1;
      }
    }

    // Whatever is left was deleted (or moved out of range) in Google
    const gone = [...byUid.values()];
    if (gone.length > 0) {
      const ids = gone.map((event) => event.id);
      const [withFiles, withLinks] = await Promise.all([
        db.select({ eventId: eventFiles.eventId }).from(eventFiles).where(inArray(eventFiles.eventId, ids)),
        db.select({ eventId: links.eventId }).from(links).where(inArray(links.eventId, ids)),
      ]);
      const attached = new Set([...withFiles, ...withLinks].map((row) => row.eventId));
      for (const event of gone) {
        const hasDetails =
          attached.has(event.id) ||
          event.schedule.length > 0 ||
          [event.notes, event.pocName, event.pocPhone, event.driverName, event.driverFee, event.trailerNotes].some(Boolean);
        if (hasDetails) {
          if (!event.removedFromSource) {
            await db.update(events).set({ removedFromSource: true, updatedAt: now }).where(eq(events.id, event.id));
          }
          result.kept += 1;
        } else {
          await db.delete(events).where(eq(events.id, event.id));
          result.removed += 1;
        }
      }
    }

    await db
      .update(calendarSources)
      .set({
        lastSyncedAt: now,
        lastStatus: `${result.added} added · ${result.updated} updated · ${result.removed} removed${result.kept ? ` · ${result.kept} kept` : ''}`,
        updatedAt: now,
      })
      .where(eq(calendarSources.id, GOOGLE_SOURCE_ID));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await db
      .update(calendarSources)
      .set({ lastStatus: `Failed: ${message}`, updatedAt: new Date().toISOString() })
      .where(eq(calendarSources.id, GOOGLE_SOURCE_ID));
    throw error;
  }
}
