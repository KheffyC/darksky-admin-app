import { cleanText, isDate } from '@/lib/session-user';

export type TaskFields = {
  title?: string;
  details?: string | null;
  ownerId?: string | null;
  dueDate?: string | null;
};

/** Picks the editable task fields present in the body; `requireTitle` for creates. */
export function parseTaskFields(body: Record<string, unknown>, requireTitle: boolean): TaskFields | { error: string } {
  const fields: TaskFields = {};

  if (requireTitle || 'title' in body) {
    const title = cleanText(body.title);
    if (!title) return { error: 'Task title is required' };
    fields.title = title;
  }
  if ('details' in body) {
    fields.details = cleanText(body.details) || null;
  }
  if ('ownerId' in body) {
    fields.ownerId = typeof body.ownerId === 'string' && body.ownerId ? body.ownerId : null;
  }
  if ('dueDate' in body) {
    if (body.dueDate && !isDate(body.dueDate)) return { error: 'Due date must be YYYY-MM-DD' };
    fields.dueDate = (body.dueDate as string) || null;
  }

  return fields;
}
