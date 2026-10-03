import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { noteEntries, notes, tasks, users } from '@/db/schema';
import { cleanText, requireUserId } from '@/lib/session-user';

type Params = { params: Promise<{ id: string }> };

// GET /api/notes/[id] - A note with its entries, oldest first
export async function GET(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const entries = await db
      .select({
        entry: noteEntries,
        authorFirstName: users.firstName,
        taskTitle: tasks.title,
        taskCompletedAt: tasks.completedAt,
      })
      .from(noteEntries)
      .leftJoin(users, eq(users.id, noteEntries.authorId))
      .leftJoin(tasks, eq(tasks.id, noteEntries.taskId))
      .where(eq(noteEntries.noteId, id))
      .orderBy(asc(noteEntries.createdAt));

    return NextResponse.json({
      ...note,
      entries: entries.map(({ entry, authorFirstName, taskTitle, taskCompletedAt }) => ({
        ...entry,
        authorName: authorFirstName ?? 'Former user',
        task: entry.taskId && taskTitle ? { title: taskTitle, completed: Boolean(taskCompletedAt) } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

// PUT /api/notes/[id] - Rename or pin/unpin
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = await request.json();
    const changes: Partial<typeof notes.$inferInsert> = {};
    if ('title' in body) {
      const title = cleanText(body.title);
      if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      changes.title = title;
    }
    if (typeof body.pinned === 'boolean') {
      changes.pinned = body.pinned;
    }

    // Leaves updatedAt alone so renaming or pinning doesn't reorder the list by activity
    const [note] = await db.update(notes).set(changes).where(eq(notes.id, id)).returning();
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete a note and all its entries
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const deleted = await db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
