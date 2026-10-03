import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { noteEntries } from '@/db/schema';
import { cleanText, requireUserId } from '@/lib/session-user';

type Params = { params: Promise<{ id: string }> };

async function findOwnEntry(id: string, userId: string) {
  const [entry] = await db.select().from(noteEntries).where(eq(noteEntries.id, id)).limit(1);
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  // Entries are signed by their author, so only the author changes them
  if (entry.authorId !== userId) return NextResponse.json({ error: 'You can only change your own entries' }, { status: 403 });
  return entry;
}

// PUT /api/note-entries/[id] - Edit your own entry
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const entry = await findOwnEntry(id, userId);
    if (entry instanceof NextResponse) return entry;

    const body = cleanText((await request.json()).body);
    if (!body) {
      return NextResponse.json({ error: 'Entry cannot be empty' }, { status: 400 });
    }

    const [updated] = await db
      .update(noteEntries)
      .set({ body, editedAt: new Date().toISOString() })
      .where(eq(noteEntries.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error editing note entry:', error);
    return NextResponse.json({ error: 'Failed to edit entry' }, { status: 500 });
  }
}

// DELETE /api/note-entries/[id] - Delete your own entry
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const entry = await findOwnEntry(id, userId);
    if (entry instanceof NextResponse) return entry;

    await db.delete(noteEntries).where(eq(noteEntries.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
