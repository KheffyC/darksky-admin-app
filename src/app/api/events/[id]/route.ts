import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { eventFiles, events, links } from '@/db/schema';
import { deleteFile } from '@/lib/files';
import { requireUserId } from '@/lib/session-user';
import { parseEventFields } from '../validate';

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id] - Everything for the show-day page
export async function GET(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [files, eventLinks] = await Promise.all([
      db.select().from(eventFiles).where(eq(eventFiles.eventId, id)).orderBy(asc(eventFiles.createdAt)),
      db.select().from(links).where(eq(links.eventId, id)).orderBy(asc(links.title)),
    ]);

    return NextResponse.json({ ...event, files, links: eventLinks });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Save any subset of the event's fields
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const parsed = parseEventFields(await request.json(), false);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const [event] = await db
      .update(events)
      .set({ ...parsed, updatedAt: new Date().toISOString() })
      .where(eq(events.id, id))
      .returning();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete the event and its uploaded files (its Drive links stay on the Links page)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const files = await db.select({ path: eventFiles.path }).from(eventFiles).where(eq(eventFiles.eventId, id));
    const deleted = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    await Promise.all(files.map((file) => deleteFile(file.path)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
