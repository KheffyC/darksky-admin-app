import { NextRequest, NextResponse } from 'next/server';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects, tasks } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { cleanText, requireUserId } from '@/lib/session-user';

// GET /api/projects - Projects for the viewing season with all their tasks
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const viewing = await getViewingSeason();
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.season, viewing.season))
      .orderBy(asc(projects.createdAt));

    const taskRows = projectRows.length
      ? await db
          .select()
          .from(tasks)
          .where(inArray(tasks.projectId, projectRows.map((project) => project.id)))
          .orderBy(asc(tasks.dueDate), asc(tasks.createdAt))
      : [];

    return NextResponse.json({
      season: viewing.season,
      isActiveSeason: viewing.isActiveSeason,
      projects: projectRows.map((project) => ({
        ...project,
        tasks: taskRows.filter((task) => task.projectId === project.id),
      })),
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Start a project in the viewing season
export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const body = await request.json();
    const name = cleanText(body.name);
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const now = new Date().toISOString();
    const [project] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        season,
        name,
        description: cleanText(body.description) || null,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ ...project, tasks: [] }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
