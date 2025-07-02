import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { paymentId, memberId } = await req.json();

  const unmatched = await prisma.unmatchedPayment.findUnique({
    where: { id: paymentId },
  });

  if (!unmatched) {
    return NextResponse.json({ error: 'Unmatched payment not found' }, { status: 404 });
  }

  // Create active payment
  await prisma.payment.create({
    data: {
      memberId,
      amountPaid: unmatched.amountPaid,
      paymentMethod: unmatched.paymentMethod || 'card',
      stripePaymentId: unmatched.stripePaymentId,
      paymentDate: unmatched.paymentDate,
      note: unmatched.notes ?? '',
      customerName: unmatched.customerName, // Preserve original customer name
      cardLast4: unmatched.cardLast4, // Preserve original card info
      isActive: true,
    },
  });

  // Delete from unmatched pool
  await prisma.unmatchedPayment.delete({
    where: { id: paymentId },
  });

  return NextResponse.json({ success: true });
}