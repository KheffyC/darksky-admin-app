'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Project, Task } from '@/db/schema';
import { usePeople, type Person } from '@/hooks/usePeople';
import { usePolling } from '@/hooks/usePolling';
import { formatShortDate, todayISO } from '@/lib/dates';
import { PersonBadge } from '@/components/ui/PersonBadge';
import { Sheet, inputClass, labelClass, labelTextClass, primaryButtonClass } from '@/components/ui/Sheet';

type ProjectWithTasks = Project & { tasks: Task[] };
type ProjectsResponse = { season: string; isActiveSeason: boolean; projects: ProjectWithTasks[] };

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Something went wrong');
  }
  return response.json();
}

/** Open tasks: soonest due first, undated last. */
function sortOpen(tasks: Task[]) {
  return [...tasks].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
}

export default function ProjectsPage() {
  const people = usePeople();
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [projectForm, setProjectForm] = useState<{ id?: string; name: string; description: string } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/projects');
    if (response.ok) setData(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  usePolling(load, 15_000);

  if (!data) {
    return <p className="text-sm text-muted">Loading projects…</p>;
  }

  const active = data.projects.filter((project) => project.status === 'active');
  const archived = data.projects.filter((project) => project.status === 'archived');

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Something went wrong');
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{data.season} season</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-ink">Projects</h1>
        </div>
        <button
          type="button"
          onClick={() => setProjectForm({ name: '', description: '' })}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-hover"
        >
          <PlusIcon className="h-4 w-4" /> Project
        </button>
      </div>

      {!data.isActiveSeason && (
        <p className="rounded-2xl border border-flag-line bg-flag-soft p-4 text-sm text-flag">
          You&apos;re viewing a past season. Use &ldquo;Move to current season&rdquo; on any project you still need.
        </p>
      )}

      {active.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong bg-white p-8 text-center">
          <p className="font-semibold text-ink">No projects yet</p>
          <p className="mt-1 text-sm text-muted">Start one for the show design, a fundraiser, or the trailer.</p>
        </div>
      )}

      {active.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          people={people}
          isActiveSeason={data.isActiveSeason}
          onToggleTask={(task) => run(() => send(`/api/tasks/${task.id}`, 'PUT', { completed: !task.completedAt }))}
          onAddTask={(fields) => run(() => send(`/api/projects/${project.id}/tasks`, 'POST', fields))}
          onEditTask={setEditingTask}
          onRename={() => setProjectForm({ id: project.id, name: project.name, description: project.description ?? '' })}
          onArchive={() => run(() => send(`/api/projects/${project.id}`, 'PUT', { status: 'archived' }))}
          onMove={() => run(() => send(`/api/projects/${project.id}`, 'PUT', { moveToActiveSeason: true }))}
        />
      ))}

      {archived.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex min-h-[44px] w-full items-center justify-center gap-1 text-sm font-semibold text-muted hover:text-ink"
          >
            <ChevronRightIcon className={`h-4 w-4 transition ${showArchived ? 'rotate-90' : ''}`} />
            Archived projects ({archived.length})
          </button>
          {showArchived &&
            archived.map((project) => (
              <div key={project.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{project.name}</p>
                  <p className="text-xs text-muted">
                    {project.tasks.filter((task) => task.completedAt).length} of {project.tasks.length} done
                  </p>
                </div>
                <div className="flex flex-none gap-2">
                  <button
                    type="button"
                    onClick={() => run(() => send(`/api/projects/${project.id}`, 'PUT', { status: 'active' }))}
                    className="min-h-[36px] rounded-full border border-line-strong px-3 text-xs font-semibold text-ink hover:border-ink"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${project.name}" and all its tasks? This can't be undone.`)) {
                        run(() => send(`/api/projects/${project.id}`, 'DELETE'));
                      }
                    }}
                    className="min-h-[36px] rounded-full border border-line px-3 text-xs font-semibold text-muted hover:border-behind hover:text-behind"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {projectForm && (
        <ProjectSheet
          initial={projectForm}
          onClose={() => setProjectForm(null)}
          onSave={async (fields) => {
            await send(projectForm.id ? `/api/projects/${projectForm.id}` : '/api/projects', projectForm.id ? 'PUT' : 'POST', fields);
            setProjectForm(null);
            await load();
          }}
        />
      )}

      {editingTask && (
        <TaskSheet
          task={editingTask}
          people={people}
          onClose={() => setEditingTask(null)}
          onSave={async (fields) => {
            await send(`/api/tasks/${editingTask.id}`, 'PUT', fields);
            setEditingTask(null);
            await load();
          }}
          onDelete={async () => {
            await send(`/api/tasks/${editingTask.id}`, 'DELETE');
            setEditingTask(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

type NewTaskFields = { title: string; ownerId: string | null; dueDate: string | null };

function ProjectCard({
  project,
  people,
  isActiveSeason,
  onToggleTask,
  onAddTask,
  onEditTask,
  onRename,
  onArchive,
  onMove,
}: {
  project: ProjectWithTasks;
  people: Person[];
  isActiveSeason: boolean;
  onToggleTask: (task: Task) => void;
  onAddTask: (fields: NewTaskFields) => Promise<void>;
  onEditTask: (task: Task) => void;
  onRename: () => void;
  onArchive: () => void;
  onMove: () => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [draft, setDraft] = useState<NewTaskFields>({ title: '', ownerId: null, dueDate: null });
  const [adding, setAdding] = useState(false);

  const open = sortOpen(project.tasks.filter((task) => !task.completedAt));
  const done = project.tasks
    .filter((task) => task.completedAt)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const total = project.tasks.length;
  const percent = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setAdding(true);
    await onAddTask(draft);
    setDraft({ title: '', ownerId: draft.ownerId, dueDate: null });
    setAdding(false);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">{project.name}</h2>
          {project.description && <p className="text-sm text-muted">{project.description}</p>}
        </div>
        <span className="flex-none text-sm text-muted">
          {done.length} of {total} done
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-canvas">
        <div className="h-1.5 rounded-full bg-ink transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul>
        {open.map((task) => (
          <TaskRow key={task.id} task={task} people={people} onToggle={() => onToggleTask(task)} onEdit={() => onEditTask(task)} />
        ))}
        {showCompleted &&
          done.map((task) => (
            <TaskRow key={task.id} task={task} people={people} onToggle={() => onToggleTask(task)} onEdit={() => onEditTask(task)} />
          ))}
      </ul>

      {done.length > 0 && (
        <button
          type="button"
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex min-h-[36px] items-center gap-1 text-sm font-semibold text-ink"
        >
          <ChevronRightIcon className={`h-4 w-4 transition ${showCompleted ? 'rotate-90' : ''}`} />
          {showCompleted ? 'Hide completed' : `Show completed (${done.length})`}
        </button>
      )}

      <form onSubmit={addTask} className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="min-w-[180px] flex-1">
          <span className="sr-only">New task</span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Add a task…"
            className="min-h-[44px] w-full rounded-xl border border-line bg-wash px-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:bg-white focus:outline-none"
          />
        </label>
        {draft.title && (
          <>
            <label>
              <span className="sr-only">Owner</span>
              <select
                value={draft.ownerId ?? ''}
                onChange={(event) => setDraft({ ...draft, ownerId: event.target.value || null })}
                className="min-h-[44px] rounded-xl border border-line bg-white px-2 text-sm text-ink"
              >
                <option value="">No owner</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Due date</span>
              <input
                type="date"
                value={draft.dueDate ?? ''}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || null })}
                className="min-h-[44px] rounded-xl border border-line bg-white px-2 text-sm text-ink"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="min-h-[44px] rounded-full border border-ink bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add
            </button>
          </>
        )}
      </form>

      <div className="flex flex-wrap gap-2 border-t border-line pt-3 text-xs font-semibold">
        <button type="button" onClick={onRename} className="min-h-[32px] rounded-full border border-line px-3 text-muted hover:border-ink hover:text-ink">
          Edit
        </button>
        <button type="button" onClick={onArchive} className="min-h-[32px] rounded-full border border-line px-3 text-muted hover:border-ink hover:text-ink">
          Archive
        </button>
        {!isActiveSeason && (
          <button type="button" onClick={onMove} className="min-h-[32px] rounded-full border border-ink px-3 text-ink hover:bg-ink hover:text-white">
            Move to current season
          </button>
        )}
      </div>
    </section>
  );
}

function TaskRow({ task, people, onToggle, onEdit }: { task: Task; people: Person[]; onToggle: () => void; onEdit: () => void }) {
  const done = Boolean(task.completedAt);
  const overdue = !done && task.dueDate !== null && task.dueDate < todayISO();
  const owner = people.find((person) => person.id === task.ownerId);

  return (
    <li className="flex min-h-[48px] items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        aria-pressed={done}
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border-[1.8px] border-ink ${done ? 'bg-ink text-white' : 'bg-white'}`}
      >
        {done && <CheckIcon className="h-4 w-4" strokeWidth={3} />}
      </button>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-[15px] ${done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</span>
      </button>
      {task.dueDate && (
        <span className={`flex-none text-xs ${overdue ? 'font-bold text-behind' : 'text-muted'}`}>{formatShortDate(task.dueDate)}</span>
      )}
      {owner && <PersonBadge person={owner} />}
    </li>
  );
}

function ProjectSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: { id?: string; name: string; description: string };
  onClose: () => void;
  onSave: (fields: { name: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Sheet title={initial.id ? 'Edit project' : 'New project'} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await onSave({ name, description });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
            setSaving(false);
          }
        }}
        className="space-y-4"
      >
        <label className={labelClass}>
          <span className={labelTextClass}>Name</span>
          <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Spring show design" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Description (optional)</span>
          <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} />
        </label>
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save project'}
        </button>
      </form>
    </Sheet>
  );
}

function TaskSheet({
  task,
  people,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task;
  people: Person[];
  onClose: () => void;
  onSave: (fields: { title: string; details: string; ownerId: string | null; dueDate: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details ?? '');
  const [ownerId, setOwnerId] = useState<string | null>(task.ownerId);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Sheet title="Edit task" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          try {
            await onSave({ title, details, ownerId, dueDate: dueDate || null });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save');
            setSaving(false);
          }
        }}
        className="space-y-4"
      >
        <label className={labelClass}>
          <span className={labelTextClass}>Task</span>
          <input type="text" required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </label>
        <fieldset>
          <legend className={labelTextClass}>Owner</legend>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {[{ id: null, label: 'No owner' }, ...people.map((person) => ({ id: person.id, label: person.firstName }))].map((option) => (
              <button
                key={option.id ?? 'none'}
                type="button"
                aria-pressed={ownerId === option.id}
                onClick={() => setOwnerId(option.id)}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${
                  ownerId === option.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={labelClass}>
          <span className={labelTextClass}>Due date</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Details</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={3}
            className={`${inputClass} py-3`}
          />
        </label>
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save task'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${task.title}"?`)) onDelete().catch((err) => setError(err.message));
          }}
          className="min-h-[44px] w-full text-sm font-semibold text-behind"
        >
          Delete task
        </button>
      </form>
    </Sheet>
  );
}
