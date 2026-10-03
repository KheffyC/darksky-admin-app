import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { cleanText, requireUserId } from '@/lib/session-user';

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/projects/[id]
 * Accepts any of: name, description, status ('active' | 'archived'),
 * moveToActiveSeason (true moves the project and its tasks into the active season)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = await request.json();
    const changes: Partial<typeof projects.$inferInsert> = {};

    if ('name' in body) {
      const name = cleanText(body.name);
      if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
      changes.name = name;
    }
    if ('description' in body) {
      changes.description = cleanText(body.description) || null;
    }
    if ('status' in body) {
      if (body.status !== 'active' && body.status !== 'archived') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      changes.status = body.status;
    }
    if (body.moveToActiveSeason === true) {
      const { activeSeason } = await getViewingSeason();
      if (!activeSeason) return NextResponse.json({ error: 'No active season is set' }, { status: 400 });
      changes.season = activeSeason;
    }

    const [project] = await db
      .update(projects)
      .set({ ...changes, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id))
      .returning();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project and all its tasks
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const deleted = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
