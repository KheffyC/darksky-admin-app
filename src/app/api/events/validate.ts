import type { NewEvent, ScheduleItem } from '@/db/schema';
import { cleanText, isDate } from '@/lib/session-user';

export const EVENT_TYPES = ['show', 'rehearsal', 'deadline', 'other'] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TEXT_FIELDS = ['location', 'address', 'notes', 'pocName', 'pocRole', 'pocPhone', 'driverName', 'trailerNotes'] as const;

type EventFields = Partial<Omit<NewEvent, 'id' | 'season' | 'createdBy' | 'createdAt' | 'updatedAt'>>;

/**
 * Picks the event fields present in the body. Creates need type, title, and date;
 * edits may send any subset (each show-page section saves only its own fields).
 */
export function parseEventFields(body: Record<string, unknown>, isCreate: boolean): EventFields | { error: string } {
  const fields: EventFields = {};

  if (isCreate || 'type' in body) {
    if (!EVENT_TYPES.includes(body.type as (typeof EVENT_TYPES)[number])) return { error: 'Pick a type' };
    fields.type = body.type as string;
  }
  if (isCreate || 'title' in body) {
    const title = cleanText(body.title);
    if (!title) return { error: 'Title is required' };
    fields.title = title;
  }
  if (isCreate || 'date' in body) {
    if (!isDate(body.date)) return { error: 'Date is required' };
    fields.date = body.date;
  }
  for (const key of ['startTime', 'endTime'] as const) {
    if (key in body) {
      if (body[key] && !TIME_PATTERN.test(String(body[key]))) return { error: 'Times must be HH:MM' };
      fields[key] = (body[key] as string) || null;
    }
  }
  for (const key of TEXT_FIELDS) {
    if (key in body) fields[key] = cleanText(body[key]) || null;
  }
  if ('driverFee' in body) {
    const raw = String(body.driverFee ?? '').replace(/[$,\s]/g, '');
    if (!raw) {
      fields.driverFee = null;
    } else {
      const fee = Number(raw);
      if (!Number.isFinite(fee) || fee < 0 || fee >= 100_000_000) return { error: 'Driver fee must be a dollar amount' };
      fields.driverFee = fee.toFixed(2);
    }
  }
  if ('schedule' in body) {
    if (!Array.isArray(body.schedule)) return { error: 'Schedule must be a list' };
    const schedule: ScheduleItem[] = [];
    for (const item of body.schedule as Record<string, unknown>[]) {
      const label = cleanText(item?.label);
      const time = cleanText(item?.time);
      if (!label && !time) continue; // blank rows from the editor
      if (time && !TIME_PATTERN.test(time)) return { error: 'Schedule times must be HH:MM' };
      schedule.push({ time, label });
    }
    fields.schedule = schedule.sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  }

  return fields;
}
