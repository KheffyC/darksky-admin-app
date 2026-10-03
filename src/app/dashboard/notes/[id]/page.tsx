'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, PaperAirplaneIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Note, NoteEntry, Project } from '@/db/schema';
import { useAuth } from '@/components/auth/PermissionGuard';
import { usePeople, type Person } from '@/hooks/usePeople';
import { usePolling } from '@/hooks/usePolling';
import { formatRelativeTime } from '@/lib/dates';
import { PersonBadge } from '@/components/ui/PersonBadge';
import { Sheet, inputClass, labelClass, labelTextClass, primaryButtonClass } from '@/components/ui/Sheet';

type Entry = NoteEntry & { authorName: string; task: { title: string; completed: boolean } | null };
type Thread = Note & { entries: Entry[] };

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

export default function NoteThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const people = usePeople();
  const [thread, setThread] = useState<Thread | null>(null);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [makingTask, setMakingTask] = useState<Entry | null>(null);
  const [lastLoaded, setLastLoaded] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const entryCount = useRef(0);

  const load = useCallback(async () => {
    const response = await fetch(`/api/notes/${id}`);
    if (response.status === 404) {
      setMissing(true);
      return;
    }
    if (response.ok) {
      setThread(await response.json());
      setLastLoaded(Date.now());
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);
  usePolling(load, 5_000);

  // Keep the newest entry in view when entries arrive (yours or the other person's)
  useEffect(() => {
    const count = thread?.entries.length ?? 0;
    if (count > entryCount.current) bottomRef.current?.scrollIntoView({ behavior: entryCount.current ? 'smooth' : 'auto' });
    entryCount.current = count;
  }, [thread?.entries.length]);

  const post = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      await send(`/api/notes/${id}/entries`, 'POST', { body: draft });
      setDraft('');
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not post');
    } finally {
      setPosting(false);
    }
  };

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <p className="font-semibold text-ink">This note was deleted.</p>
        <Link href="/dashboard/notes" className="text-sm font-semibold text-ink underline">
          Back to notes
        </Link>
      </div>
    );
  }
  if (!thread) return <p className="text-sm text-muted">Loading…</p>;

  const otherPeople = people.filter((person) => person.id !== user?.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard/notes" className="flex min-h-[40px] items-center gap-1 text-sm font-semibold text-ink">
            <ArrowLeftIcon className="h-4 w-4" /> Notes
          </Link>
          <span className="text-xs text-muted" aria-live="polite">
            {lastLoaded ? 'Live · updates every few seconds' : ''}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{thread.title}</h1>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={async () => {
              await send(`/api/notes/${id}`, 'PUT', { pinned: !thread.pinned });
              await load();
            }}
            className={`min-h-[32px] rounded-full border px-3 ${thread.pinned ? 'border-ink bg-ink text-white' : 'border-line text-muted hover:border-ink hover:text-ink'}`}
          >
            {thread.pinned ? 'Pinned' : 'Pin'}
          </button>
          <button
            type="button"
            onClick={async () => {
              const title = prompt('Rename note', thread.title);
              if (title && title.trim() !== thread.title) {
                await send(`/api/notes/${id}`, 'PUT', { title });
                await load();
              }
            }}
            className="min-h-[32px] rounded-full border border-line px-3 text-muted hover:border-ink hover:text-ink"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={async () => {
              if (confirm(`Delete "${thread.title}" and every entry in it?`)) {
                await send(`/api/notes/${id}`, 'DELETE');
                router.push('/dashboard/notes');
              }
            }}
            className="min-h-[32px] rounded-full border border-line px-3 text-muted hover:border-behind hover:text-behind"
          >
            Delete
          </button>
        </div>
      </div>

      <ol className="space-y-3">
        {thread.entries.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line-strong bg-white p-6 text-center text-sm text-muted">
            Nothing here yet. Add the first entry below.
          </li>
        )}
        {thread.entries.map((entry) => {
          const mine = entry.authorId === user?.id;
          const author = people.find((person) => person.id === entry.authorId);
          return (
            <li key={entry.id} className="flex items-start gap-3">
              <PersonBadge person={author} name={entry.authorName} />
              <div className="min-w-0 flex-1 rounded-[4px_16px_16px_16px] border border-line bg-white px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{entry.authorName}</span>
                  <span className="text-xs text-muted">
                    {formatRelativeTime(entry.createdAt)}
                    {entry.editedAt ? ' · edited' : ''}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{entry.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {entry.task ? (
                    <Link
                      href="/dashboard/projects"
                      className={`inline-flex min-h-[28px] items-center gap-1 rounded-full border px-2.5 text-xs font-semibold ${
                        entry.task.completed ? 'border-paid-line bg-paid-soft text-paid' : 'border-line bg-wash text-ink'
                      }`}
                    >
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                      Task: {entry.task.title}
                      {entry.task.completed ? ' · done' : ''}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMakingTask(entry)}
                      className="min-h-[28px] rounded-full border border-line px-2.5 text-xs font-semibold text-muted hover:border-ink hover:text-ink"
                    >
                      Make it a task
                    </button>
                  )}
                  {mine && (
                    <>
                      <button
                        type="button"
                        aria-label="Edit entry"
                        onClick={() => setEditing(entry)}
                        className="rounded-full p-1.5 text-muted hover:text-ink"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete entry"
                        onClick={async () => {
                          if (confirm('Delete this entry?')) {
                            await send(`/api/note-entries/${entry.id}`, 'DELETE');
                            await load();
                          }
                        }}
                        className="rounded-full p-1.5 text-muted hover:text-behind"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={bottomRef} />

      {/* Composer stays above the phone's bottom nav */}
      <form
        onSubmit={post}
        className="sticky bottom-24 z-30 flex items-end gap-2 rounded-3xl border border-line bg-white p-2 shadow-lg lg:bottom-4"
      >
        <label className="flex-1">
          <span className="sr-only">Add an entry</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends on a keyboard; Shift+Enter adds a line
              if (event.key === 'Enter' && !event.shiftKey && !('ontouchstart' in window)) {
                event.preventDefault();
                post();
              }
            }}
            rows={Math.min(5, Math.max(1, draft.split('\n').length))}
            placeholder={otherPeople.length ? `Add a note for ${otherPeople.map((p) => p.firstName).join(', ')}…` : 'Add a note…'}
            className="block max-h-40 w-full resize-none rounded-2xl bg-transparent px-3 py-3 text-base text-ink placeholder:text-subtle focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={posting || !draft.trim()}
          aria-label="Send"
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink text-white disabled:opacity-40"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>

      {editing && (
        <EditEntrySheet
          entry={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            await send(`/api/note-entries/${editing.id}`, 'PUT', { body });
            setEditing(null);
            await load();
          }}
        />
      )}

      {makingTask && (
        <MakeTaskSheet
          entry={makingTask}
          people={people}
          defaultOwnerId={user?.id ?? null}
          onClose={() => setMakingTask(null)}
          onSave={async (fields) => {
            await send(`/api/note-entries/${makingTask.id}/task`, 'POST', fields);
            setMakingTask(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EditEntrySheet({ entry, onClose, onSave }: { entry: Entry; onClose: () => void; onSave: (body: string) => Promise<void> }) {
  const [body, setBody] = useState(entry.body);
  const [error, setError] = useState<string | null>(null);

  return (
    <Sheet title="Edit entry" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(body).catch((err) => setError(err.message));
        }}
        className="space-y-4"
      >
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} className={`${inputClass} py-3`} />
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" className={primaryButtonClass}>
          Save
        </button>
      </form>
    </Sheet>
  );
}

function MakeTaskSheet({
  entry,
  people,
  defaultOwnerId,
  onClose,
  onSave,
}: {
  entry: Entry;
  people: Person[];
  defaultOwnerId: string | null;
  onClose: () => void;
  onSave: (fields: { projectId: string; title: string; ownerId: string | null; dueDate: string | null }) => Promise<void>;
}) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState(entry.body.split('\n')[0].slice(0, 120));
  const [ownerId, setOwnerId] = useState<string | null>(defaultOwnerId);
  const [dueDate, setDueDate] = useState('');
  const [newProject, setNewProject] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then((response) => (response.ok ? response.json() : { projects: [] }))
      .then((data: { projects: Project[] }) => {
        const active = data.projects.filter((project) => project.status === 'active');
        setProjects(active);
        if (active[0]) setProjectId(active[0].id);
      })
      .catch(() => setProjects([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let targetId = projectId;
      // No projects yet: create one inline so the entry isn't stuck
      if (!targetId && newProject.trim()) {
        targetId = (await send('/api/projects', 'POST', { name: newProject })).id;
      }
      await onSave({ projectId: targetId, title, ownerId, dueDate: dueDate || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create task');
      setSaving(false);
    }
  };

  return (
    <Sheet title="Make it a task" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Task</span>
          <input type="text" required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </label>

        {projects === null ? (
          <p className="text-sm text-muted">Loading projects…</p>
        ) : projects.length > 0 ? (
          <label className={labelClass}>
            <span className={labelTextClass}>Project</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputClass}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className={labelClass}>
            <span className={labelTextClass}>New project</span>
            <input
              type="text"
              required
              value={newProject}
              onChange={(event) => setNewProject(event.target.value)}
              placeholder="No projects yet. Name one"
              className={inputClass}
            />
          </label>
        )}

        <fieldset>
          <legend className={labelTextClass}>Owner</legend>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {people.map((person) => (
              <button
                key={person.id}
                type="button"
                aria-pressed={ownerId === person.id}
                onClick={() => setOwnerId(ownerId === person.id ? null : person.id)}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${
                  ownerId === person.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'
                }`}
              >
                {person.firstName}
              </button>
            ))}
          </div>
        </fieldset>

        <label className={labelClass}>
          <span className={labelTextClass}>Due date (optional)</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
        </label>

        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Creating…' : 'Create task'}
        </button>
      </form>
    </Sheet>
  );
}
