import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tasks } from '@/db/schema';
import { requireUserId } from '@/lib/session-user';
import { parseTaskFields } from '../validate';

type Params = { params: Promise<{ id: string }> };

// PUT /api/tasks/[id] - Edit fields and/or { completed: boolean }
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = parseTaskFields(body, false);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const changes: Partial<typeof tasks.$inferInsert> = { ...parsed };
    if (typeof body.completed === 'boolean') {
      changes.completedAt = body.completed ? new Date().toISOString() : null;
      changes.completedBy = body.completed ? userId : null;
    }

    const [task] = await db
      .update(tasks)
      .set({ ...changes, updatedAt: new Date().toISOString() })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
