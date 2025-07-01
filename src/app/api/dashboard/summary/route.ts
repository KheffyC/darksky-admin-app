import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const members = await prisma.member.findMany({
    include: {
      payments: {
        where: { isActive: true },
      },
    },
  });

  const totalMembers = members.length;
  let totalPaid = 0;
  let outstanding = 0;
  let membersWithNoPayments = 0;

  members.forEach(m => {
    const paid = m.payments.reduce((sum, p) => sum + p.amountPaid, 0);
    totalPaid += paid;
    outstanding += Math.max(m.tuitionAmount - paid, 0);
    if (paid === 0) membersWithNoPayments++;
  });

  return NextResponse.json({
    totalMembers,
    totalPaid,
    outstanding,
    membersWithNoPayments,
    nextPaymentDue: null, // You’ll populate manually for now
  });
}