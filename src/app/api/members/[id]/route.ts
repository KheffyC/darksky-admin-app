import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments, tuitionEditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { tuitionAmount } = body;

    // Validate tuition amount
    if (typeof tuitionAmount !== 'number' || tuitionAmount <= 0) {
      return NextResponse.json(
        { message: 'Invalid tuition amount' },
        { status: 400 }
      );
    }

    // Check if member exists and get current tuition
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      );
    }

    const oldAmount = existingMember[0].tuitionAmount;

    // Update member's tuition amount
    await db
      .update(members)
      .set({ 
        tuitionAmount,
        updatedAt: new Date().toISOString()
      })
      .where(eq(members.id, id));

    // Log the tuition edit
    await db
      .insert(tuitionEditLogs)
      .values({
        id: nanoid(),
        memberId: id,
        oldAmount: Math.round(oldAmount),
        newAmount: Math.round(tuitionAmount),
        editedBy: session.user.email || session.user.name || 'Unknown',
        editedAt: new Date().toISOString(),
      });

    return NextResponse.json(
      { 
        message: 'Tuition amount updated successfully',
        oldAmount,
        newAmount: tuitionAmount
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update tuition error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
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
