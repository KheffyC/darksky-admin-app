import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // First, check if member exists
    const member = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member has any active payments
    const memberPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.memberId, id))
      .limit(1);

    if (memberPayments.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete member with existing payments. Remove payments first.' },
        { status: 400 }
      );
    }

    // Delete the member
    await db
      .delete(members)
      .where(eq(members.id, id));

    return NextResponse.json(
      { message: 'Member deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
