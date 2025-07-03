import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentSchedules, type NewPaymentSchedule } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/payment-schedules - Get all payment schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let schedules;
    
    if (activeOnly) {
      schedules = await db
        .select()
        .from(paymentSchedules)
        .where(eq(paymentSchedules.isActive, true))
        .orderBy(desc(paymentSchedules.dueDate));
    } else {
      schedules = await db
        .select()
        .from(paymentSchedules)
        .orderBy(desc(paymentSchedules.dueDate));
    }

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching payment schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment schedules' },
      { status: 500 }
    );
  }
}

// POST /api/payment-schedules - Create a new payment schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, dueDate, amount, season } = body;
    if (!name || !dueDate || !amount || !season) {
      return NextResponse.json(
        { error: 'Missing required fields: name, dueDate, amount, season' },
        { status: 400 }
      );
    }

    // Create the schedule
    const newSchedule: NewPaymentSchedule = {
      id: crypto.randomUUID(),
      name,
      description: body.description || null,
      dueDate,
      amount: amount.toString(),
      season,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const [schedule] = await db.insert(paymentSchedules).values(newSchedule).returning();

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating payment schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create payment schedule' },
      { status: 500 }
    );
  }
}
