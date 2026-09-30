import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { ROLES, hasRole } from '@/lib/permissions';
import { getCurrentSeasonSettings } from '@/lib/current-season';

// Create a new season, copying organization-level settings from the current one
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { season, defaultTuition, makeCurrent } = await request.json();
    const name = typeof season === 'string' ? season.trim() : '';
    const tuition = Number(defaultTuition);

    if (!name) {
      return NextResponse.json({ error: 'Season name is required' }, { status: 400 });
    }
    if (!Number.isFinite(tuition) || tuition <= 0) {
      return NextResponse.json({ error: 'Default tuition must be greater than 0' }, { status: 400 });
    }

    const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.season, name)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: `Season ${name} already exists` }, { status: 409 });
    }

    const current = await getCurrentSeasonSettings();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      if (makeCurrent) {
        await tx.update(settings).set({ currentSeason: false, updatedAt: now });
      }

      await tx.insert(settings).values({
        id,
        organizationName: current?.organizationName ?? 'Dark Sky',
        season: name,
        defaultTuition: tuition,
        paymentDueDate: null,
        emailNotifications: current?.emailNotifications ?? true,
        autoReconcile: current?.autoReconcile ?? false,
        // The first season ever created is always current
        currentSeason: Boolean(makeCurrent) || !current,
        updatedAt: now,
      });
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to create season:', error);
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }
}
