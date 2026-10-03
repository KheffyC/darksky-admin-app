import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects, tasks } from '@/db/schema';
import { requireUserId } from '@/lib/session-user';
import { parseTaskFields } from '@/app/api/tasks/validate';

// POST /api/projects/[id]/tasks - Add a task to a project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const parsed = parseTaskFields(await request.json(), true);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const [task] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        projectId: id,
        title: parsed.title!,
        details: parsed.details ?? null,
        ownerId: parsed.ownerId ?? null,
        dueDate: parsed.dueDate ?? null,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
