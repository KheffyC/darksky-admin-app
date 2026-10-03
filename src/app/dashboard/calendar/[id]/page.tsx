'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CameraIcon,
  DocumentIcon,
  FolderIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import type { Event, EventFile, Link as LinkRow, ScheduleItem } from '@/db/schema';
import { formatTime } from '@/lib/dates';
import { fileUrl, uploadFile } from '@/lib/upload-client';
import { Sheet, inputClass, labelClass, labelTextClass, primaryButtonClass } from '@/components/ui/Sheet';
import { EventBasicsSheet, EVENT_TYPE_LABELS } from '../EventBasicsSheet';

type EventDetail = Event & { files: EventFile[]; links: LinkRow[] };
type SectionKey = 'basics' | 'schedule' | 'contact' | 'trailer' | 'notes' | 'link' | null;

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Something went wrong');
  return result;
}

/** Apple Maps on iPhone/iPad, Google Maps elsewhere. */
function directionsUrl(query: string) {
  const encoded = encodeURIComponent(query);
  return /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && 'ontouchend' in document
    ? `https://maps.apple.com/?daddr=${encoded}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState<SectionKey>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/events/${id}`);
    if (response.status === 404) setMissing(true);
    else if (response.ok) setEvent(await response.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (fields: Record<string, unknown>) => {
    await send(`/api/events/${id}`, 'PUT', fields);
    setEditing(null);
    await load();
  };

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <p className="font-semibold text-ink">This event was deleted.</p>
        <Link href="/dashboard/calendar" className="text-sm font-semibold text-ink underline">
          Back to calendar
        </Link>
      </div>
    );
  }
  if (!event) return <p className="text-sm text-muted">Loading…</p>;

  const isShow = event.type === 'show';
  const day = new Date(`${event.date}T12:00:00`);
  const where = event.address || event.location;
  const timeLine =
    event.startTime &&
    `${isShow ? 'Call ' : ''}${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ''}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="-mx-4 -mt-6 space-y-2 bg-ink px-5 pb-5 pt-4 text-white sm:mx-0 sm:mt-0 sm:rounded-3xl">
        <Link href="/dashboard/calendar" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-white">
          <ArrowLeftIcon className="h-4 w-4" /> Calendar
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
          {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ·{' '}
          {EVENT_TYPE_LABELS[event.type]}
        </p>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em]">{event.title}</h1>
        {(event.location || event.address) && (
          <p className="text-sm text-neutral-300">{[event.location, event.address].filter(Boolean).join(' · ')}</p>
        )}
        {timeLine && <p className="text-sm text-neutral-300">{timeLine}</p>}
        {event.source === 'linked' && <p className="text-xs text-neutral-400">From your linked calendar</p>}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {where ? (
            <a
              href="#"
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                window.open(directionsUrl(where), '_blank', 'noopener');
              }}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-ink"
            >
              <MapPinIcon className="h-5 w-5" /> Directions
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setEditing('basics')}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white"
            >
              <MapPinIcon className="h-5 w-5" /> Add address
            </button>
          )}
          {event.pocPhone ? (
            <a
              href={`tel:${event.pocPhone.replace(/[^\d+]/g, '')}`}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-neutral-600 text-sm font-bold text-white"
            >
              <PhoneIcon className="h-5 w-5" /> Call site contact
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setEditing('basics')}
              className="flex min-h-[44px] items-center justify-center rounded-full border border-neutral-600 text-sm font-semibold text-white"
            >
              Edit details
            </button>
          )}
        </div>
        {event.pocPhone && (
          <button type="button" onClick={() => setEditing('basics')} className="text-xs font-semibold text-neutral-400 underline">
            Edit name, date, times, place
          </button>
        )}
      </header>

      {event.removedFromSource && (
        <div className="rounded-2xl border border-flag-line bg-flag-soft p-4 text-sm text-flag">
          <p className="font-semibold">Deleted from your linked calendar</p>
          <p className="mt-1">It was kept here because it has details you added. Delete it below if it&apos;s no longer happening.</p>
        </div>
      )}

      {isShow && (
        <Section title="Day schedule" onEdit={() => setEditing('schedule')} empty={event.schedule.length === 0} emptyText="Add load-in, call, warm-up, perform, retreat…">
          <ul className="space-y-2">
            {event.schedule.map((item, index) => (
              <li key={index} className="flex gap-4">
                <span className="w-[72px] flex-none font-mono text-sm font-medium text-ink">{formatTime(item.time) || '—'}</span>
                <span className="text-[15px] text-ink">{item.label}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {isShow && (
        <Section title="Site point of contact" onEdit={() => setEditing('contact')} empty={!event.pocName && !event.pocPhone} emptyText="Who to find when you arrive">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{event.pocName || 'Contact'}</p>
              <p className="text-sm text-muted">{[event.pocRole, event.pocPhone].filter(Boolean).join(' · ')}</p>
            </div>
            {event.pocPhone && (
              <a
                href={`tel:${event.pocPhone.replace(/[^\d+]/g, '')}`}
                aria-label={`Call ${event.pocName || 'contact'}`}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line-strong text-ink"
              >
                <PhoneIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </Section>
      )}

      {isShow && (
        <Section
          title="Trailer"
          onEdit={() => setEditing('trailer')}
          empty={!event.driverName && !event.driverFee && !event.trailerNotes}
          emptyText="Driver, fee, route, where to park and unload"
        >
          <div className="flex gap-3">
            <TruckIcon className="h-5 w-5 flex-none text-ink" />
            <div className="space-y-1">
              {(event.driverName || event.driverFee) && (
                <p className="font-semibold text-ink">
                  {event.driverName || 'Driver'}
                  {event.driverFee && <span className="font-mono font-medium"> · {currency.format(Number(event.driverFee))}</span>}
                </p>
              )}
              {event.trailerNotes && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{event.trailerNotes}</p>}
            </div>
          </div>
        </Section>
      )}

      <FilesSection eventId={event.id} files={event.files} title={isShow ? 'Maps & diagrams' : 'Files'} onChange={load} />

      <Section title="Notes" onEdit={() => setEditing('notes')} empty={!event.notes} emptyText={isShow ? 'Gate codes, food plan, anything from last year' : 'Anything to remember'}>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{event.notes}</p>
      </Section>

      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink">Drive links</h2>
          <button type="button" onClick={() => setEditing('link')} className="flex min-h-[36px] items-center gap-1 text-sm font-semibold text-ink">
            <PlusIcon className="h-4 w-4" /> Add
          </button>
        </div>
        {event.links.length === 0 ? (
          <p className="text-sm text-muted">Show packet, judge sheets, site info…</p>
        ) : (
          <ul className="divide-y divide-line">
            {event.links.map((link) => (
              <li key={link.id} className="flex items-center gap-3">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3">
                  <FolderIcon className="h-5 w-5 flex-none text-ink" />
                  <span className="truncate font-semibold text-ink">{link.title}</span>
                </a>
                <button
                  type="button"
                  aria-label={`Remove ${link.title}`}
                  onClick={async () => {
                    if (confirm(`Remove "${link.title}"?`)) {
                      await send(`/api/links/${link.id}`, 'DELETE');
                      await load();
                    }
                  }}
                  className="rounded-full p-2 text-muted hover:text-behind"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={async () => {
          if (confirm(`Delete "${event.title}"? Its uploaded maps and files are deleted too.`)) {
            await send(`/api/events/${event.id}`, 'DELETE');
            router.push('/dashboard/calendar');
          }
        }}
        className="min-h-[44px] w-full text-sm font-semibold text-behind"
      >
        Delete {EVENT_TYPE_LABELS[event.type].toLowerCase()}
      </button>

      {editing === 'basics' && (
        <EventBasicsSheet
          title="Edit details"
          note={
            event.source === 'linked'
              ? 'This comes from your linked calendar. Change the name, date, times, or place there; edits here are replaced on the next sync. The type stays as you set it.'
              : undefined
          }
          initial={{
            type: event.type,
            title: event.title,
            date: event.date,
            startTime: event.startTime ?? '',
            endTime: event.endTime ?? '',
            location: event.location ?? '',
            address: event.address ?? '',
          }}
          onClose={() => setEditing(null)}
          onSave={(fields) => save(fields)}
        />
      )}
      {editing === 'schedule' && <ScheduleSheet initial={event.schedule} onClose={() => setEditing(null)} onSave={(schedule) => save({ schedule })} />}
      {editing === 'contact' && (
        <FieldsSheet
          title="Site point of contact"
          fields={[
            { key: 'pocName', label: 'Name', value: event.pocName },
            { key: 'pocRole', label: 'Role', value: event.pocRole, placeholder: 'Contest director' },
            { key: 'pocPhone', label: 'Phone', value: event.pocPhone, type: 'tel' },
          ]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {editing === 'trailer' && (
        <FieldsSheet
          title="Trailer"
          fields={[
            { key: 'driverName', label: 'Driver', value: event.driverName },
            { key: 'driverFee', label: 'Driver fee', value: event.driverFee, inputMode: 'decimal', placeholder: '$0.00' },
            { key: 'trailerNotes', label: 'Route, parking, unload', value: event.trailerNotes, multiline: true },
          ]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {editing === 'notes' && (
        <FieldsSheet
          title="Notes"
          fields={[{ key: 'notes', label: 'Notes', value: event.notes, multiline: true }]}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {editing === 'link' && (
        <FieldsSheet
          title="Add a Drive link"
          fields={[
            { key: 'title', label: 'Title', value: '', placeholder: `${event.title} packet`, required: true },
            { key: 'url', label: 'URL', value: '', type: 'url', placeholder: 'https://drive.google.com/…', required: true },
          ]}
          onClose={() => setEditing(null)}
          onSave={async (fields) => {
            await send('/api/links', 'POST', { ...fields, category: 'Show packets', eventId: event.id });
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  onEdit,
  empty,
  emptyText,
  children,
}: {
  title: string;
  onEdit: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink">{title}</h2>
        <button type="button" onClick={onEdit} className="min-h-[36px] px-1 text-sm font-semibold text-ink">
          {empty ? 'Add' : 'Edit'}
        </button>
      </div>
      {empty ? (
        <button type="button" onClick={onEdit} className="text-left text-sm text-muted">
          {emptyText}
        </button>
      ) : (
        children
      )}
    </section>
  );
}

type FieldSpec = {
  key: string;
  label: string;
  value: string | null;
  placeholder?: string;
  type?: string;
  inputMode?: 'decimal';
  multiline?: boolean;
  required?: boolean;
};

function FieldsSheet({
  title,
  fields,
  onClose,
  onSave,
}: {
  title: string;
  fields: FieldSpec[];
  onClose: () => void;
  onSave: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.value ?? ''])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Sheet title={title} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          try {
            await onSave(values);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
            setSaving(false);
          }
        }}
        className="space-y-4"
      >
        {fields.map((field) => (
          <label key={field.key} className={labelClass}>
            <span className={labelTextClass}>{field.label}</span>
            {field.multiline ? (
              <textarea
                value={values[field.key]}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                rows={5}
                className={`${inputClass} py-3`}
              />
            ) : (
              <input
                type={field.type ?? 'text'}
                inputMode={field.inputMode}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                className={inputClass}
              />
            )}
          </label>
        ))}
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Sheet>
  );
}

function ScheduleSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: ScheduleItem[];
  onClose: () => void;
  onSave: (schedule: ScheduleItem[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<ScheduleItem[]>(() =>
    initial.length ? initial : [{ time: '', label: 'Load-in' }, { time: '', label: 'Call' }, { time: '', label: 'Warm-up' }, { time: '', label: 'Perform' }, { time: '', label: 'Retreat' }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (index: number, changes: Partial<ScheduleItem>) =>
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));

  return (
    <Sheet title="Day schedule" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          try {
            await onSave(rows);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
            setSaving(false);
          }
        }}
        className="space-y-3"
      >
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <label className="w-[120px] flex-none">
              <span className="sr-only">Time</span>
              <input type="time" value={row.time} onChange={(event) => update(index, { time: event.target.value })} className={`${inputClass} px-2`} />
            </label>
            <label className="flex-1">
              <span className="sr-only">What happens</span>
              <input type="text" value={row.label} onChange={(event) => update(index, { label: event.target.value })} className={inputClass} />
            </label>
            <button
              type="button"
              aria-label="Remove row"
              onClick={() => setRows(rows.filter((_, rowIndex) => rowIndex !== index))}
              className="rounded-full p-2 text-muted hover:text-behind"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, { time: '', label: '' }])}
          className="flex min-h-[40px] items-center gap-1 text-sm font-semibold text-ink"
        >
          <PlusIcon className="h-4 w-4" /> Add a row
        </button>
        <p className="text-xs text-muted">Rows are sorted by time when you save. Leave a row blank to drop it.</p>
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </form>
    </Sheet>
  );
}

function FilesSection({ eventId, files, title, onChange }: { eventId: string; files: EventFile[]; title: string; onChange: () => Promise<void> }) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const picked = changeEvent.target.files?.[0];
    changeEvent.target.value = '';
    if (!picked) return;
    const label = prompt('What is this? (e.g. Site map, Unload diagram)', picked.type === 'application/pdf' ? picked.name.replace(/\.pdf$/i, '') : 'Site map');
    if (label === null) return;

    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile(picked, 'events');
      await send(`/api/events/${eventId}/files`, 'POST', { path, label });
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink">{title}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            disabled={uploading}
            aria-label="Take a photo"
            className="rounded-full p-2 text-ink hover:bg-wash disabled:opacity-40"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex min-h-[36px] items-center gap-1 text-sm font-semibold text-ink disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" /> Upload
          </button>
        </div>
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
      <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={pick} className="hidden" />

      {uploading && <p className="mb-2 text-sm text-muted">Uploading…</p>}
      {error && <p className="mb-2 text-sm text-behind">{error}</p>}
      {files.length === 0 && !uploading ? (
        <p className="text-sm text-muted">Upload the site map, unload diagram, or parking layout.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {files.map((file) => (
            <li key={file.id} className="relative">
              <a
                href={fileUrl(file.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas"
              >
                {file.path.endsWith('.pdf') ? (
                  <DocumentIcon className="h-8 w-8 text-muted" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- private files come from an authed route
                  <img src={fileUrl(file.path)} alt={file.label} className="h-full w-full object-cover" loading="lazy" />
                )}
              </a>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-ink">{file.label}</span>
                <button
                  type="button"
                  aria-label={`Delete ${file.label}`}
                  onClick={async () => {
                    if (confirm(`Delete "${file.label}"?`)) {
                      await send(`/api/event-files/${file.id}`, 'DELETE');
                      await onChange();
                    }
                  }}
                  className="rounded-full p-1.5 text-muted hover:text-behind"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
