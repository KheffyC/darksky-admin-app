import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentSchedules } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/payment-schedules/[id] - Get a specific payment schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [schedule] = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.id, id));

    if (!schedule) {
      return NextResponse.json(
        { error: 'Payment schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching payment schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment schedule' },
      { status: 500 }
    );
  }
}

// PUT /api/payment-schedules/[id] - Update a payment schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if schedule exists
    const [existingSchedule] = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.id, id));

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Payment schedule not found' },
        { status: 404 }
      );
    }

    // Update the schedule
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;

    const [updatedSchedule] = await db
      .update(paymentSchedules)
      .set(updateData)
      .where(eq(paymentSchedules.id, id))
      .returning();

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating payment schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update payment schedule' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-schedules/[id] - Delete (deactivate) a payment schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if schedule exists
    const [existingSchedule] = await db
      .select()
      .from(paymentSchedules)
      .where(eq(paymentSchedules.id, id));

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Payment schedule not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const [updatedSchedule] = await db
      .update(paymentSchedules)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paymentSchedules.id, id))
      .returning();

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error('Error deleting payment schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment schedule' },
      { status: 500 }
    );
  }
}
