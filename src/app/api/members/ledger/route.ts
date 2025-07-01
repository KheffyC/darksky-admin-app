import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const members = await prisma.member.findMany({
    include: {
      payments: {
        where: { isActive: true },
        orderBy: { paymentDate: 'asc' },
      },
    },
  });

  const data = members.map((m) => {
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

  return NextResponse.json(data);
}