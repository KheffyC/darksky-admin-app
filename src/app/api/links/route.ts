import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { links } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { parseLinkInput } from './validate';

// GET /api/links - Links for the viewing season, pinned first
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { season } = await getViewingSeason();
    const rows = await db
      .select()
      .from(links)
      .where(eq(links.season, season))
      .orderBy(desc(links.pinned), asc(links.category), asc(links.title));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// POST /api/links - Add a link to the viewing season
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = parseLinkInput(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const now = new Date().toISOString();
    const [link] = await db
      .insert(links)
      .values({
        id: crypto.randomUUID(),
        season,
        ...parsed,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
