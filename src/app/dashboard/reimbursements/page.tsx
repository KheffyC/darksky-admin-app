'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CameraIcon, DocumentIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/auth/PermissionGuard';
import type { Reimbursement } from '@/db/schema';

type Row = Reimbursement & { paidByName: string };
type UserOption = { id: string; name: string; firstName: string };
type FormState = {
  id?: string;
  paidBy: string;
  amount: string;
  description: string;
  purchasedOn: string;
  receiptPath: string | null;
};

const METHODS = ['Venmo', 'Zelle', 'Cash', 'Check', 'Other'];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return '';
  // Date-only strings are parsed as UTC; pin to noon so the day doesn't shift
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fileUrl(pathname: string) {
  return `/api/files/${pathname}`;
}

/** Shrinks phone photos to ~1600px JPEG before upload; anything it can't decode is sent as-is. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    return blob ? new File([blob], 'receipt.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

export default function ReimbursementsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [people, setPeople] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'owed' | 'reimbursed'>('owed');
  const [form, setForm] = useState<FormState | null>(null);
  const [payingBack, setPayingBack] = useState<Row | null>(null);

  const load = async () => {
    const response = await fetch('/api/reimbursements');
    setRows(response.ok ? await response.json() : []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
    fetch('/api/users/options')
      .then((response) => (response.ok ? response.json() : []))
      .then(setPeople)
      .catch(() => setPeople([]));
  }, []);

  const owed = rows.filter((row) => row.status === 'owed');
  const reimbursed = rows.filter((row) => row.status === 'reimbursed');
  const visible = tab === 'owed' ? owed : reimbursed;

  const owedByPerson = useMemo(() => {
    const totals = new Map<string, { name: string; total: number; count: number }>();
    for (const person of people) totals.set(person.id, { name: person.firstName, total: 0, count: 0 });
    for (const row of owed) {
      const entry = totals.get(row.paidBy) ?? { name: row.paidByName.split(' ')[0], total: 0, count: 0 };
      entry.total += Number(row.amount);
      entry.count += 1;
      totals.set(row.paidBy, entry);
    }
    return [...totals.entries()];
  }, [owed, people]);

  const openNew = () =>
    setForm({ paidBy: user?.id ?? people[0]?.id ?? '', amount: '', description: '', purchasedOn: today(), receiptPath: null });

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${row.description}"? The receipt photo is deleted too.`)) return;
    await fetch(`/api/reimbursements/${row.id}`, { method: 'DELETE' });
    await load();
  };

  const reopen = async (row: Row) => {
    await fetch(`/api/reimbursements/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reopen' }),
    });
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Out-of-pocket purchases</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Reimbursements</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="hidden min-h-[44px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-hover sm:flex"
        >
          <CameraIcon className="h-5 w-5" /> Add receipt
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {owedByPerson.map(([id, entry]) => (
          <div key={id} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Owed to {entry.name}</p>
            <p className="mt-1 font-mono text-2xl font-medium text-ink">{currency.format(entry.total)}</p>
            <p className="text-xs text-muted">
              {entry.count} receipt{entry.count === 1 ? '' : 's'}
            </p>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Filter" className="flex rounded-full bg-line/70 p-1">
        {(['owed', 'reimbursed'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-[40px] flex-1 rounded-full text-sm font-semibold transition ${
              tab === value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {value === 'owed' ? `Owed (${owed.length})` : `Paid back (${reimbursed.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center">
          <p className="font-semibold text-ink">{tab === 'owed' ? 'Nobody is owed anything' : 'Nothing paid back yet'}</p>
          {tab === 'owed' && <p className="mt-1 text-sm text-muted">Snap a receipt when you buy something for the group.</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
              <ReceiptThumb pathname={row.receiptPath} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{row.description}</p>
                <p className="truncate text-xs text-muted">
                  {formatDate(row.purchasedOn)} · {row.paidByName.split(' ')[0]}
                  {row.status === 'reimbursed' &&
                    ` · Paid back ${formatDate(row.reimbursedOn)}${row.reimbursedMethod ? ` by ${row.reimbursedMethod}` : ''}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {row.status === 'owed' ? (
                    <button
                      type="button"
                      onClick={() => setPayingBack(row)}
                      className="min-h-[32px] rounded-full border border-ink px-3 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
                    >
                      Mark paid back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reopen(row)}
                      className="min-h-[32px] rounded-full border border-line px-3 text-xs font-semibold text-muted hover:border-ink hover:text-ink"
                    >
                      Move back to owed
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Edit ${row.description}`}
                    onClick={() =>
                      setForm({
                        id: row.id,
                        paidBy: row.paidBy,
                        amount: row.amount,
                        description: row.description,
                        purchasedOn: row.purchasedOn,
                        receiptPath: row.receiptPath,
                      })
                    }
                    className="rounded-full p-2 text-muted hover:text-ink"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${row.description}`}
                    onClick={() => remove(row)}
                    className="rounded-full p-2 text-muted hover:text-behind"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="self-start font-mono text-base font-medium text-ink">{currency.format(Number(row.amount))}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Floating add button on phones, above the bottom nav */}
      <button
        type="button"
        onClick={openNew}
        className="fixed bottom-28 right-4 z-40 flex min-h-[52px] items-center gap-2 rounded-full border border-ink bg-ink px-5 text-sm font-semibold text-white shadow-lg sm:hidden"
      >
        <CameraIcon className="h-5 w-5" /> Add receipt
      </button>

      {form && (
        <ReceiptForm
          initial={form}
          people={people}
          onClose={() => setForm(null)}
          onSaved={async () => {
            setForm(null);
            setTab('owed');
            await load();
          }}
        />
      )}

      {payingBack && (
        <PayBackForm
          row={payingBack}
          onClose={() => setPayingBack(null)}
          onSaved={async () => {
            setPayingBack(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ReceiptThumb({ pathname }: { pathname: string | null }) {
  if (!pathname) {
    return (
      <div className="flex h-16 w-14 flex-none items-center justify-center rounded-lg border border-dashed border-line-strong text-[10px] text-subtle">
        No photo
      </div>
    );
  }
  const isPdf = pathname.endsWith('.pdf');
  return (
    <a
      href={fileUrl(pathname)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open receipt"
      className="flex h-16 w-14 flex-none items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas"
    >
      {isPdf ? (
        <DocumentIcon className="h-6 w-6 text-muted" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- private files come from an authed route
        <img src={fileUrl(pathname)} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
    </a>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:text-ink">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  'min-h-[48px] w-full rounded-xl border border-line-strong bg-white px-4 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';
const labelClass = 'block space-y-1.5';
const labelTextClass = 'text-xs font-semibold uppercase tracking-[0.15em] text-muted';

function ReceiptForm({
  initial,
  people,
  onClose,
  onSaved,
}: {
  initial: FormState;
  people: UserOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState<string | null>(initial.receiptPath ? fileUrl(initial.receiptPath) : null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const pickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;

    setError(null);
    if (picked.type === 'application/pdf' && picked.size > 4 * 1024 * 1024) {
      setError('PDF is larger than 4 MB');
      return;
    }
    setUploading(true);
    setPreview(picked.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(picked));
    try {
      const body = new FormData();
      body.append('file', await compressImage(picked));
      body.append('folder', 'receipts');
      const response = await fetch('/api/files', { method: 'POST', body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      setForm((current) => ({ ...current, receiptPath: result.pathname }));
    } catch (err) {
      setPreview(form.receiptPath ? fileUrl(form.receiptPath) : null);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(form.id ? `/api/reimbursements/${form.id}` : '/api/reimbursements', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not save');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title={form.id ? 'Edit receipt' : 'New receipt'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {/* capture opens the camera directly; the second input allows photo library or a PDF */}
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" />
        <input ref={fileInput} type="file" accept="image/*,application/pdf" onChange={pickPhoto} className="hidden" />
        <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas text-sm font-semibold text-muted">
          {preview === 'pdf' ? (
            <span className="flex flex-col items-center gap-2">
              <DocumentIcon className="h-8 w-8" /> PDF attached
            </span>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview or authed private file
            <img src={preview} alt="Receipt preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2">
              <CameraIcon className="h-8 w-8" /> No receipt yet
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-ink">Uploading…</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-ink bg-ink text-sm font-semibold text-white"
          >
            <CameraIcon className="h-5 w-5" /> {preview ? 'Retake' : 'Take photo'}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="min-h-[44px] rounded-full border border-line-strong bg-white text-sm font-semibold text-ink"
          >
            Choose file
          </button>
        </div>

        <label className={labelClass}>
          <span className={labelTextClass}>Amount</span>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="$0.00"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            className={`${inputClass} font-mono`}
          />
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>What was it</span>
          <input
            type="text"
            required
            placeholder="Gaff tape ×6, Home Depot"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Date</span>
          <input
            type="date"
            required
            value={form.purchasedOn}
            onChange={(event) => setForm({ ...form, purchasedOn: event.target.value })}
            className={inputClass}
          />
        </label>

        <fieldset className="space-y-1.5">
          <legend className={labelTextClass}>Paid by</legend>
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                aria-pressed={form.paidBy === person.id}
                onClick={() => setForm({ ...form, paidBy: person.id })}
                className={`min-h-[44px] rounded-full border text-sm font-semibold ${
                  form.paidBy === person.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'
                }`}
              >
                {person.firstName}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-behind">{error}</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="min-h-[52px] w-full rounded-full border border-ink bg-ink text-base font-semibold text-white transition hover:bg-ink-hover disabled:opacity-50"
        >
          {uploading ? 'Uploading photo…' : saving ? 'Saving…' : 'Save receipt'}
        </button>
      </form>
    </Sheet>
  );
}

function PayBackForm({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [method, setMethod] = useState('Venmo');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/reimbursements/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reimburse', reimbursedOn: date, reimbursedMethod: method }),
    });
    setSaving(false);
    if (response.ok) {
      onSaved();
    } else {
      const result = await response.json().catch(() => ({}));
      setError(result.error || 'Could not save');
    }
  };

  return (
    <Sheet title="Mark paid back" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-muted">
          {currency.format(Number(row.amount))} to {row.paidByName.split(' ')[0]} for {row.description}
        </p>
        <fieldset className="space-y-1.5">
          <legend className={labelTextClass}>How</legend>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {METHODS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={method === value}
                onClick={() => setMethod(value)}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${
                  method === value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={labelClass}>
          <span className={labelTextClass}>Date</span>
          <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
        </label>
        {error && <p className="text-sm text-behind">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="min-h-[52px] w-full rounded-full border border-ink bg-ink text-base font-semibold text-white transition hover:bg-ink-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Mark paid back'}
        </button>
      </form>
    </Sheet>
  );
}
