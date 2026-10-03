'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Note } from '@/db/schema';
import { usePolling } from '@/hooks/usePolling';
import { formatRelativeTime } from '@/lib/dates';

type NoteSummary = Note & { entryCount: number; lastBody: string | null; lastAuthor: string | null };

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/notes');
    if (response.ok) setNotes(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  usePolling(load, 15_000);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setCreating(false);
    if (response.ok) {
      const note = await response.json();
      router.push(`/dashboard/notes/${note.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Shared between both of you</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Notes</h1>
      </div>

      <form onSubmit={create} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">New note title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Start a note, e.g. Notes from this weekend"
            className="min-h-[48px] w-full rounded-xl border border-line-strong bg-white px-4 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </label>
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="min-h-[48px] rounded-full border border-ink bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Start
        </button>
      </form>

      {notes === null ? (
        <p className="text-sm text-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center">
          <p className="font-semibold text-ink">No notes yet</p>
          <p className="mt-1 text-sm text-muted">Try &ldquo;Things to discuss this week&rdquo; and pin it.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/dashboard/notes/${note.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-ink"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {note.pinned && (
                      <span className="flex-none rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Pinned
                      </span>
                    )}
                    <p className="truncate font-semibold text-ink">{note.title}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {note.lastBody ? `${note.lastAuthor ?? 'Someone'}: ${note.lastBody}` : 'No entries yet'}
                  </p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1 text-xs text-muted">
                  <span>{formatRelativeTime(note.updatedAt)}</span>
                  <span>{note.entryCount} {note.entryCount === 1 ? 'entry' : 'entries'}</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 flex-none text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
