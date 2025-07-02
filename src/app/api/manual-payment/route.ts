import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unmatchedPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const payment = await db
      .insert(unmatchedPayments)
      .values({
        id: crypto.randomUUID(),
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: new Date(data.paymentDate).toISOString(),
        paymentMethod: data.paymentMethod || 'card',
        cardLast4: data.paymentMethod === 'card' ? (data.cardLast4 || null) : null,
        customerName: data.customerName || null,
        notes: data.notes || null,
        stripePaymentId: data.stripePaymentId || null,
      })
      .returning();

    return NextResponse.json({ success: true, payment: payment[0] });
  } catch (error) {
    console.error('Manual payment error:', error);
    return new NextResponse('Failed to create payment', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();

    const updated = await db
      .update(unmatchedPayments)
      .set({
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: new Date(data.paymentDate).toISOString(),
        paymentMethod: data.paymentMethod || 'card',
        cardLast4: data.paymentMethod === 'card' ? (data.cardLast4 || null) : null,
        customerName: data.customerName || null,
        notes: data.notes || null,
        stripePaymentId: data.stripePaymentId || null,
      })
      .where(eq(unmatchedPayments.id, data.id))
      .returning();

    return NextResponse.json({ success: true, updated: updated[0] });
  } catch (error) {
    console.error('Update manual payment error:', error);
    return new NextResponse('Failed to update payment', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const data = await req.json();

    await db
      .delete(unmatchedPayments)
      .where(eq(unmatchedPayments.id, data.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete manual payment error:', error);
    return new NextResponse('Failed to delete payment', { status: 500 });
  }
}