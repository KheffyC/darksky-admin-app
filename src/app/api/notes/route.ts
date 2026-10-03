import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notes } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { cleanText, requireUserId } from '@/lib/session-user';

// GET /api/notes - Note threads for the viewing season, pinned first, most recently active next
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { season } = await getViewingSeason();
    const rows = await db
      .select({
        note: notes,
        // Written with explicit aliases: Drizzle leaves columns unqualified inside sql``, which makes "id" ambiguous
        entryCount: sql<number>`(select count(*)::int from "NoteEntry" ne where ne."noteId" = "Note"."id")`,
        lastBody: sql<string | null>`(select ne."body" from "NoteEntry" ne where ne."noteId" = "Note"."id" order by ne."createdAt" desc limit 1)`,
        lastAuthor: sql<string | null>`(select u."firstName" from "NoteEntry" ne join "User" u on u."id" = ne."authorId" where ne."noteId" = "Note"."id" order by ne."createdAt" desc limit 1)`,
      })
      .from(notes)
      .where(eq(notes.season, season))
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));

    return NextResponse.json(rows.map(({ note, ...summary }) => ({ ...note, ...summary })));
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes - Start a note thread in the viewing season
export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const body = await request.json();
    const title = cleanText(body.title);
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const now = new Date().toISOString();
    const [note] = await db
      .insert(notes)
      .values({
        id: crypto.randomUUID(),
        season,
        title,
        pinned: body.pinned === true,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
