import { NextResponse } from 'next/server';
import { syncGoogleCalendar } from '@/lib/calendar-sync';
import { requireUserId } from '@/lib/session-user';

// POST /api/calendar-sync/run - Sync the linked Google calendar now
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    return NextResponse.json(await syncGoogleCalendar());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Sync failed' }, { status: 502 });
  }
}
