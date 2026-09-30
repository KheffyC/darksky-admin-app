import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments, tuitionEditLogs } from '@/db/schema';
import { auth } from '@/lib/auth';
import { ROLES, hasRole } from '@/lib/permissions';

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Run in a transaction so a failure part-way through doesn't leave
    // members without their payments (or vice versa).
    const result = await db.transaction(async (tx) => {
      // Payment and TuitionEditLog both reference Member with ON DELETE RESTRICT,
      // so they must be removed before members.
      const deletedTuitionEdits = await tx
        .delete(tuitionEditLogs)
        .returning({ id: tuitionEditLogs.id });

      const deletedPayments = await tx
        .delete(payments)
        .returning({ id: payments.id });

      const deletedMembers = await tx
        .delete(members)
        .returning({ id: members.id });

      return {
        deletedTuitionEdits: deletedTuitionEdits.length,
        deletedPayments: deletedPayments.length,
        deletedMembers: deletedMembers.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'All members and payments deleted successfully',
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
