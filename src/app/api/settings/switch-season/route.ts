import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { ROLES, hasRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { seasonId } = await request.json();

    if (!seasonId) {
      return NextResponse.json(
        { error: 'Season ID is required' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // First, set all seasons to not current
      await tx
        .update(settings)
        .set({ 
          currentSeason: false,
          updatedAt: new Date().toISOString()
        });

      // Then set the selected season as current
      await tx
        .update(settings)
        .set({ 
          currentSeason: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(settings.id, seasonId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching season:', error);
    return NextResponse.json(
      { error: 'Failed to switch season' },
      { status: 500 }
    );
  }
}
