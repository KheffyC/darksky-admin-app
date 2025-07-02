// app/api/payments/unassign/route.ts
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { paymentId } = await req.json();

  // 1. Mark as inactive
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { isActive: false },
  });

  // 2. Add to unmatched payments
  await prisma.unmatchedPayment.create({
    data: {
      stripePaymentId: payment.stripePaymentId,
      amountPaid: payment.amountPaid,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4, // Restore original card info
      customerName: payment.customerName, // Restore original customer name
      notes: payment.note || '',
    },
  });

  // 3. Return updated ledger (optional: re-query)
  const members = await prisma.member.findMany({
    include: {
      payments: {
        where: { isActive: true },
        orderBy: { paymentDate: 'asc' },
      },
    },
  });

  const updated = members.map((m) => {
    const totalPaid = m.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const remaining = m.tuitionAmount - totalPaid;

    return {
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      section: m.section,
      tuitionAmount: m.tuitionAmount,
      totalPaid,
      remaining,
      status:
        totalPaid >= m.tuitionAmount
          ? 'paid'
          : totalPaid > 0
          ? 'partial'
          : 'unpaid',
      payments: m.payments,
    };
  });

  return NextResponse.json(updated);
}