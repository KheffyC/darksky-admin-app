'use client';

import { useState } from 'react';
import { Sheet, inputClass, labelClass, labelTextClass, primaryButtonClass } from '@/components/ui/Sheet';

export const EVENT_TYPE_LABELS: Record<string, string> = {
  show: 'Show',
  rehearsal: 'Rehearsal',
  deadline: 'Deadline',
  other: 'Other',
};

export type EventBasics = {
  type: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
};

/** Type, name, date, times, and place: used to add an event and to edit one. */
export function EventBasicsSheet({
  title,
  note,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  note?: string;
  initial: EventBasics;
  onClose: () => void;
  onSave: (fields: EventBasics) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (changes: Partial<EventBasics>) => setForm((current) => ({ ...current, ...changes }));

  return (
    <Sheet title={title} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          try {
            await onSave(form);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
            setSaving(false);
          }
        }}
        className="space-y-4"
      >
        {note && <p className="rounded-xl bg-canvas px-3 py-2 text-sm text-muted">{note}</p>}
        <fieldset>
          <legend className={labelTextClass}>Type</legend>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.type === value}
                onClick={() => set({ type: value })}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${
                  form.type === value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={labelClass}>
          <span className={labelTextClass}>Name</span>
          <input
            type="text"
            required
            value={form.title}
            onChange={(event) => set({ title: event.target.value })}
            placeholder={form.type === 'show' ? 'Regional championship' : form.type === 'rehearsal' ? 'Full ensemble rehearsal' : ''}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Date</span>
          <input type="date" required value={form.date} onChange={(event) => set({ date: event.target.value })} className={inputClass} />
        </label>
        {form.type !== 'deadline' && (
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={labelTextClass}>{form.type === 'show' ? 'Call time' : 'Starts'}</span>
              <input type="time" value={form.startTime} onChange={(event) => set({ startTime: event.target.value })} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Ends</span>
              <input type="time" value={form.endTime} onChange={(event) => set({ endTime: event.target.value })} className={inputClass} />
            </label>
          </div>
        )}
        {form.type !== 'deadline' && (
          <>
            <label className={labelClass}>
              <span className={labelTextClass}>Venue</span>
              <input type="text" value={form.location} onChange={(event) => set({ location: event.target.value })} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Address</span>
              <input
                type="text"
                value={form.address}
                onChange={(event) => set({ address: event.target.value })}
                placeholder="Used for the Directions button"
                className={inputClass}
              />
            </label>
          </>
        )}
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Sheet>
  );
}
