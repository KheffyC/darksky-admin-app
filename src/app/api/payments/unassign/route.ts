// app/api/payments/unassign/route.ts
import { db } from '@/lib/db';
import { payments, unmatchedPayments, members } from '@/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { paymentId } = await req.json();

  // 1. Get the payment first
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (payment.length === 0) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const paymentData = payment[0];

  // 2. Mark as inactive
  await db
    .update(payments)
    .set({ isActive: false })
    .where(eq(payments.id, paymentId));

  // 3. Add to unmatched payments
  await db
    .insert(unmatchedPayments)
    .values({
      id: crypto.randomUUID(),
      stripePaymentId: paymentData.stripePaymentId,
      amountPaid: paymentData.amountPaid,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      cardLast4: paymentData.cardLast4, // Restore original card info
      customerName: paymentData.customerName, // Restore original customer name
      notes: paymentData.note || '',
    });

  // 4. Return updated ledger
  const membersWithPayments = await db
    .select()
    .from(members)
    .leftJoin(payments, and(eq(payments.memberId, members.id), eq(payments.isActive, true)))
    .orderBy(members.lastName);

  // Group payments by member and calculate totals
  const memberMap = new Map();
  
  membersWithPayments.forEach(row => {
    const member = row.Member;
    const payment = row.Payment;
    
    if (!memberMap.has(member.id)) {
      memberMap.set(member.id, {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        section: member.section,
        tuitionAmount: member.tuitionAmount,
        payments: [],
      });
    }
    
    if (payment) {
      memberMap.get(member.id).payments.push({
        ...payment,
        amountPaid: payment.amountPaid
      });
    }
  });

  const updated = Array.from(memberMap.values()).map(member => {
    const totalPaid = member.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
    const remaining = member.tuitionAmount - totalPaid;

    return {
      ...member,
      totalPaid,
      remaining,
      status: totalPaid >= member.tuitionAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
    };
  });

  return NextResponse.json(updated);
}