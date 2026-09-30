import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { VIEW_SEASON_COOKIE, getViewingSeason } from '@/lib/current-season';

// GET: seasons available to view, and which one this user is viewing
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [viewing, seasons] = await Promise.all([
    getViewingSeason(),
    db.select({ season: settings.season }).from(settings).orderBy(settings.season),
  ]);

  return NextResponse.json({
    seasons: seasons.map((s) => s.season),
    viewing: viewing.season,
    active: viewing.activeSeason,
  });
}

// POST { season }: view that season; an empty season follows the active season
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { season } = await request.json();
  const response = NextResponse.json({ success: true });

  if (!season) {
    response.cookies.delete(VIEW_SEASON_COOKIE);
    return response;
  }

  const exists = await db.select({ id: settings.id }).from(settings).where(eq(settings.season, season)).limit(1);
  if (exists.length === 0) {
    return NextResponse.json({ error: `Season ${season} does not exist` }, { status: 404 });
  }

  response.cookies.set(VIEW_SEASON_COOKIE, season, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
