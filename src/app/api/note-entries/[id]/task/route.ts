import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { noteEntries, projects, tasks } from '@/db/schema';
import { requireUserId } from '@/lib/session-user';
import { parseTaskFields } from '@/app/api/tasks/validate';

// POST /api/note-entries/[id]/task - Turn an entry into a task { projectId, title, ownerId?, dueDate? }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = parseTaskFields(body, true);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const [entry] = await db.select().from(noteEntries).where(eq(noteEntries.id, id)).limit(1);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    if (entry.taskId) {
      return NextResponse.json({ error: 'This entry is already a task' }, { status: 409 });
    }

    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    const [project] = projectId
      ? await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1)
      : [];
    if (!project) {
      return NextResponse.json({ error: 'Pick a project' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const task = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tasks)
        .values({
          id: crypto.randomUUID(),
          projectId,
          title: parsed.title!,
          details: entry.body,
          ownerId: parsed.ownerId ?? null,
          dueDate: parsed.dueDate ?? null,
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      await tx.update(noteEntries).set({ taskId: created.id }).where(eq(noteEntries.id, id));
      return created;
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task from entry:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
