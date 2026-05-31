import { db } from '@/lib/db';
import { unmatchedPayments, payments, members } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { paymentId, memberId, scheduleId, isLate } = await req.json();

  const member = await db
    .select({ id: members.id, isActive: members.isActive })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (member.length === 0) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (!member[0].isActive) {
    return NextResponse.json({ error: 'Archived members cannot receive new payments' }, { status: 400 });
  }

  const unmatched = await db
    .select()
    .from(unmatchedPayments)
    .where(eq(unmatchedPayments.id, paymentId))
    .limit(1);

  if (unmatched.length === 0) {
    return NextResponse.json({ error: 'Unmatched payment not found' }, { status: 404 });
  }

  const unmatchedPayment = unmatched[0];

  // Create active payment
  await db
    .insert(payments)
    .values({
      id: crypto.randomUUID(),
      memberId,
      amountPaid: unmatchedPayment.amountPaid,
      paymentMethod: unmatchedPayment.paymentMethod || 'card',
      stripePaymentId: unmatchedPayment.stripePaymentId,
      paymentDate: unmatchedPayment.paymentDate,
      note: unmatchedPayment.notes ?? '',
      customerName: unmatchedPayment.customerName, // Preserve original customer name
      cardLast4: unmatchedPayment.cardLast4, // Preserve original card info
      scheduleId: scheduleId || null, // Assign to payment schedule
      isLate: isLate || false, // Mark as late if applicable
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

  // Delete from unmatched pool
  await db
    .delete(unmatchedPayments)
    .where(eq(unmatchedPayments.id, paymentId));

  return NextResponse.json({ success: true });
}