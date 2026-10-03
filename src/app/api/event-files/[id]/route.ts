import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { eventFiles } from '@/db/schema';
import { deleteFile } from '@/lib/files';
import { cleanText, requireUserId } from '@/lib/session-user';

type Params = { params: Promise<{ id: string }> };

// PUT /api/event-files/[id] - Rename an attachment
export async function PUT(request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const label = cleanText((await request.json()).label);
    if (!label) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }
    const [file] = await db.update(eventFiles).set({ label }).where(eq(eventFiles.id, id)).returning();
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json(file);
  } catch (error) {
    console.error('Error renaming event file:', error);
    return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
  }
}

// DELETE /api/event-files/[id] - Remove an attachment and its stored file
export async function DELETE(_request: NextRequest, { params }: Params) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { id } = await params;
    const [deleted] = await db.delete(eventFiles).where(eq(eventFiles.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    await deleteFile(deleted.path);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
