import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
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
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate,
      });
    }
  });

  const data = Array.from(memberMap.values()).map(member => {
    const totalPaid = member.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
    const remaining = member.tuitionAmount - totalPaid;

    return {
      ...member,
      totalPaid,
      remaining,
      status: totalPaid >= member.tuitionAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
    };
  });

  return NextResponse.json(data);
}