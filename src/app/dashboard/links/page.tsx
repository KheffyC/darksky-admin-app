'use client';

import { useEffect, useMemo, useState } from 'react';
import { FolderIcon, PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Link as LinkRow } from '@/db/schema';

type FormState = {
  id?: string;
  title: string;
  url: string;
  category: string;
  pinned: boolean;
};

const EMPTY_FORM: FormState = { title: '', url: '', category: '', pinned: false };

function hostLabel(url: string) {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith('drive.google.com')) return 'Google Drive';
    if (host.endsWith('docs.google.com')) return 'Google Docs';
    return host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch('/api/links');
    setLinks(response.ok ? await response.json() : []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const pinned = links.filter((link) => link.pinned);
  const grouped = useMemo(() => {
    const groups = new Map<string, LinkRow[]>();
    for (const link of links) {
      if (link.pinned) continue;
      groups.set(link.category, [...(groups.get(link.category) ?? []), link]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [links]);
  const categories = [...new Set(links.map((link) => link.category))].sort();

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(form.id ? `/api/links/${form.id}` : '/api/links', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save the link');
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the link');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (link: LinkRow) => {
    if (!confirm(`Remove "${link.title}"?`)) return;
    await fetch(`/api/links/${link.id}`, { method: 'DELETE' });
    await load();
  };

  const togglePin = async (link: LinkRow) => {
    await fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...link, pinned: !link.pinned }),
    });
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Shortcuts into Google Drive</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Links</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setForm(EMPTY_FORM);
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-hover"
        >
          <PlusIcon className="h-4 w-4" /> Add link
        </button>
      </div>

      {form && (
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-ink bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{form.id ? 'Edit link' : 'New link'}</h2>
            <button type="button" onClick={() => setForm(null)} aria-label="Cancel" className="rounded-full p-2 text-muted hover:text-ink">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <LabeledInput label="Title" value={form.title} placeholder="Season contracts" onChange={(title) => setForm({ ...form, title })} />
          <LabeledInput label="URL" value={form.url} placeholder="https://drive.google.com/…" type="url" onChange={(url) => setForm({ ...form, url })} />
          <LabeledInput
            label="Category"
            value={form.category}
            placeholder="Contracts"
            list="link-categories"
            onChange={(category) => setForm({ ...form, category })}
          />
          <datalist id="link-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
              className="h-5 w-5 accent-black"
            />
            Pin to the top
          </label>
          {error && <p className="text-sm text-behind">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] w-full rounded-xl border border-ink bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-hover disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save link'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading links…</p>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center">
          <p className="font-semibold text-ink">No links for this season yet</p>
          <p className="mt-1 text-sm text-muted">Add the season tracker and contracts folder first.</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <LinkGroup title="Pinned" links={pinned} onEdit={setForm} onDelete={remove} onTogglePin={togglePin} />
          )}
          {grouped.map(([category, rows]) => (
            <LinkGroup key={category} title={category} links={rows} onEdit={setForm} onDelete={remove} onTogglePin={togglePin} />
          ))}
        </>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  list?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{label}</span>
      <input
        type={type}
        value={value}
        list={list}
        placeholder={placeholder}
        required
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-xl border border-line-strong bg-white px-4 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
      />
    </label>
  );
}

function LinkGroup({
  title,
  links,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  title: string;
  links: LinkRow[];
  onEdit: (form: FormState) => void;
  onDelete: (link: LinkRow) => void;
  onTogglePin: (link: LinkRow) => void;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-ink">{title}</h2>
      <ul className="divide-y divide-line">
        {links.map((link) => (
          <li key={link.id} className="flex items-center gap-3 py-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-xl hover:bg-wash"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-canvas">
                <FolderIcon className="h-5 w-5 text-ink" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{link.title}</span>
                <span className="block truncate text-xs text-muted">{hostLabel(link.url)}</span>
              </span>
            </a>
            <button
              type="button"
              onClick={() => onTogglePin(link)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                link.pinned ? 'border-ink bg-ink text-white' : 'border-line text-muted hover:border-ink hover:text-ink'
              }`}
            >
              {link.pinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              type="button"
              aria-label={`Edit ${link.title}`}
              onClick={() => onEdit({ id: link.id, title: link.title, url: link.url, category: link.category, pinned: link.pinned })}
              className="rounded-full p-2 text-muted hover:text-ink"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${link.title}`}
              onClick={() => onDelete(link)}
              className="rounded-full p-2 text-muted hover:text-behind"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
