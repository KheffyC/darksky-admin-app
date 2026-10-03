import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { eventFiles, events } from '@/db/schema';
import { isServablePath } from '@/lib/files';
import { cleanText, requireUserId } from '@/lib/session-user';

// POST /api/events/[id]/files - Attach an uploaded file { path, label } to an event
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path : '';
    const label = cleanText(body.label) || 'Attachment';
    if (!path.startsWith('events/') || !isServablePath(path)) {
      return NextResponse.json({ error: 'Upload the file first' }, { status: 400 });
    }

    const [event] = await db.select({ id: events.id }).from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [file] = await db
      .insert(eventFiles)
      .values({ id: crypto.randomUUID(), eventId: id, label, path, createdBy: userId })
      .returning();
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('Error attaching event file:', error);
    return NextResponse.json({ error: 'Failed to attach file' }, { status: 500 });
  }
}
