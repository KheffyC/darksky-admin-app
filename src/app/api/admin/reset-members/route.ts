import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments, tuitionEditLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { ROLES, hasRole } from '@/lib/permissions';
import { getViewingSeason } from '@/lib/current-season';
import { eq, inArray } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Only the season being viewed; other seasons' history is untouched
    const { season } = await getViewingSeason();
    if (!season) {
      return NextResponse.json({ error: 'No season selected' }, { status: 400 });
    }
    // The client names the season it showed the user, so a season switched in
    // another tab can't redirect the delete
    const confirmedSeason = new URL(request.url).searchParams.get('season');
    if (confirmedSeason !== season) {
      return NextResponse.json(
        { error: `You are viewing ${season}, not ${confirmedSeason}. Reload and try again.` },
        { status: 409 }
      );
    }

    // Run in a transaction so a failure part-way through doesn't leave
    // members without their payments (or vice versa).
    const result = await db.transaction(async (tx) => {
      const seasonMemberIds = tx
        .select({ id: members.id })
        .from(members)
        .where(eq(members.season, season));

      // Payment and TuitionEditLog both reference Member with ON DELETE RESTRICT,
      // so they must be removed before members.
      const deletedTuitionEdits = await tx
        .delete(tuitionEditLogs)
        .where(inArray(tuitionEditLogs.memberId, seasonMemberIds))
        .returning({ id: tuitionEditLogs.id });

      const deletedPayments = await tx
        .delete(payments)
        .where(inArray(payments.memberId, seasonMemberIds))
        .returning({ id: payments.id });

      const deletedMembers = await tx
        .delete(members)
        .where(eq(members.season, season))
        .returning({ id: members.id });

      return {
        deletedTuitionEdits: deletedTuitionEdits.length,
        deletedPayments: deletedPayments.length,
        deletedMembers: deletedMembers.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: `All ${season} members and payments deleted successfully`,
      season,
      ...result,
    });
  } catch (error) {
    console.error('Failed to delete members and payments:', error);
    return NextResponse.json(
      { error: 'Failed to delete members and payments' },
      { status: 500 }
    );
  }
}
