import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { noteEntries, notes } from '@/db/schema';
import { cleanText, requireUserId } from '@/lib/session-user';

// POST /api/notes/[id]/entries - Add an entry to a note thread
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = cleanText((await request.json()).body);
    if (!body) {
      return NextResponse.json({ error: 'Write something first' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const [updated] = await db.update(notes).set({ updatedAt: now }).where(eq(notes.id, id)).returning({ id: notes.id });
    if (!updated) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const [entry] = await db
      .insert(noteEntries)
      .values({ id: crypto.randomUUID(), noteId: id, authorId: userId, body, createdAt: now })
      .returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error adding note entry:', error);
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}
