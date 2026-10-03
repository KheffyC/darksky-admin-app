import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarSources } from '@/db/schema';
import { calendarProvider, LINKED_SOURCE_ID, syncLinkedCalendar, validateIcsUrl } from '@/lib/calendar-sync';
import { hasRole, ROLES } from '@/lib/permissions';

/** The secret address works like a password, so only its host and file name are shown. */
function maskUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}/…/${parsed.pathname.split('/').pop()}`;
  } catch {
    return 'Linked';
  }
}

// GET /api/calendar-sync - Whether a calendar is linked and how the last sync went
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [source] = await db.select().from(calendarSources).where(eq(calendarSources.id, LINKED_SOURCE_ID)).limit(1);
  return NextResponse.json(
    source
      ? { connected: true, provider: calendarProvider(source.icsUrl), address: maskUrl(source.icsUrl), lastSyncedAt: source.lastSyncedAt, lastStatus: source.lastStatus }
      : { connected: false },
  );
}

// PUT /api/calendar-sync - Link (or replace) the calendar's secret iCal address, then sync. Admins only.
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRole(session.user.role, ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Only admins can link a calendar' }, { status: 403 });
  }

  const validated = validateIcsUrl((await request.json()).icsUrl);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db
    .insert(calendarSources)
    .values({ id: LINKED_SOURCE_ID, icsUrl: validated.url!, updatedAt: now })
    .onConflictDoUpdate({ target: calendarSources.id, set: { icsUrl: validated.url!, lastStatus: null, updatedAt: now } });

  try {
    return NextResponse.json(await syncLinkedCalendar());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sync failed' }, { status: 502 });
  }
}

// DELETE /api/calendar-sync - Stop syncing. Imported events stay on the calendar. Admins only.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRole(session.user.role, ROLES.ADMIN)) {
    return NextResponse.json({ error: 'Only admins can unlink a calendar' }, { status: 403 });
  }
  await db.delete(calendarSources).where(eq(calendarSources.id, LINKED_SOURCE_ID));
  return NextResponse.json({ success: true });
}
