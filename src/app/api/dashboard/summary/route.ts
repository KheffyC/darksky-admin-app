import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const membersWithPayments = await db
    .select()
    .from(members)
    .leftJoin(payments, and(eq(payments.memberId, members.id), eq(payments.isActive, true)));

  // Group payments by member
  const memberMap = new Map();
  
  membersWithPayments.forEach(row => {
    const member = row.Member;
    const payment = row.Payment;
    
    if (!memberMap.has(member.id)) {
      memberMap.set(member.id, {
        ...member,
        tuitionAmount: member.tuitionAmount,
        payments: [],
      });
    }
    
    if (payment) {
      memberMap.get(member.id).payments.push({
        amountPaid: payment.amountPaid
      });
    }
  });

  const membersList = Array.from(memberMap.values());
  const totalMembers = membersList.length;
  let totalPaid = 0;
  let outstanding = 0;
  let membersWithNoPayments = 0;

  membersList.forEach(m => {
    const paid = m.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
    totalPaid += paid;
    outstanding += Math.max(m.tuitionAmount - paid, 0);
    if (paid === 0) membersWithNoPayments++;
  });

  return NextResponse.json({
    totalMembers,
    totalPaid,
    outstanding,
    membersWithNoPayments,
    nextPaymentDue: null, // You'll populate manually for now
  });
}