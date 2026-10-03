import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { events, paymentSchedules } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { requireUserId } from '@/lib/session-user';
import { parseEventFields } from './validate';

// GET /api/events - The viewing season's events, plus its active payment due dates
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { season } = await getViewingSeason();
    const [eventRows, dueDates] = await Promise.all([
      db
        .select({
          id: events.id,
          type: events.type,
          title: events.title,
          date: events.date,
          startTime: events.startTime,
          endTime: events.endTime,
          location: events.location,
        })
        .from(events)
        .where(eq(events.season, season))
        .orderBy(asc(events.date), asc(events.startTime)),
      db
        .select({ id: paymentSchedules.id, name: paymentSchedules.name, dueDate: paymentSchedules.dueDate })
        .from(paymentSchedules)
        .where(and(eq(paymentSchedules.season, season), eq(paymentSchedules.isActive, true)))
        .orderBy(asc(paymentSchedules.dueDate)),
    ]);

    return NextResponse.json({ season, events: eventRows, paymentDueDates: dueDates });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Add an event to the viewing season
export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const parsed = parseEventFields(await request.json(), true);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const now = new Date().toISOString();
    const [event] = await db
      .insert(events)
      .values({
        ...parsed,
        id: crypto.randomUUID(),
        season,
        type: parsed.type!,
        title: parsed.title!,
        date: parsed.date!,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
