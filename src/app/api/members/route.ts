import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { lastName: 'asc'},
      include: {
        payments: {
          where: { isActive: true },
          select: {
            amountPaid: true
          }
        }
      }
    });

    // Calculate total paid for each member
    const membersWithTotals = members.map(member => {
      const totalPaid = member.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
      return {
        ...member,
        totalPaid,
        remaining: member.tuitionAmount - totalPaid,
        status: totalPaid >= member.tuitionAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid'
      };
    });

    return NextResponse.json(membersWithTotals);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return new NextResponse('Failed to fetch members', { status: 500 });
  }
}
