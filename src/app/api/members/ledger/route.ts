import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments, paymentSchedules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const membersWithPayments = await db
    .select()
    .from(members)
    .leftJoin(
      payments, 
      and(eq(payments.memberId, members.id), eq(payments.isActive, true))
    )
    .leftJoin(
      paymentSchedules,
      eq(payments.scheduleId, paymentSchedules.id)
    )
    .orderBy(members.lastName);

  // Group payments by member and calculate totals
  const memberMap = new Map();
  
  membersWithPayments.forEach(row => {
    const member = row.Member;
    const payment = row.Payment;
    const schedule = row.PaymentSchedule;
    
    if (!memberMap.has(member.id)) {
      memberMap.set(member.id, {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        section: member.section,
        tuitionAmount: member.tuitionAmount,
        payments: [],
        paymentGroups: new Map(), // Group payments by schedule
      });
    }
    
    if (payment) {
      // Automatically determine if payment is late based on schedule due date
      let isLate = false;
      if (schedule && schedule.dueDate) {
        const paymentDate = new Date(payment.paymentDate);
        const dueDate = new Date(schedule.dueDate);
        // Payment is late if it was made after the due date
        isLate = paymentDate > dueDate;
      }

      const paymentWithSchedule = {
        ...payment,
        schedule,
        isLate, // Override with calculated late status
        amountPaid: payment.amountPaid,
        paymentDate: payment.paymentDate,
      };
      
      memberMap.get(member.id).payments.push(paymentWithSchedule);
      
      // Group by schedule
      const scheduleKey = schedule?.id || 'unassigned';
      const scheduleName = schedule?.name || 'Unassigned Payments';
      
      const memberData = memberMap.get(member.id);
      if (!memberData.paymentGroups.has(scheduleKey)) {
        memberData.paymentGroups.set(scheduleKey, {
          scheduleName,
          schedule,
          payments: []
        });
      }
      memberData.paymentGroups.get(scheduleKey).payments.push(paymentWithSchedule);
    }
  });

  const data = Array.from(memberMap.values()).map(member => {
    const totalPaid = member.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
    const remaining = member.tuitionAmount - totalPaid;
    const latePaymentsCount = member.payments.filter((p: any) => p.isLate).length;

    // Convert payment groups Map to Array
    const paymentGroups = Array.from(member.paymentGroups.values());

    return {
      ...member,
      totalPaid,
      remaining,
      latePaymentsCount,
      paymentGroups,
      status: totalPaid >= member.tuitionAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
    };
  });

  return NextResponse.json(data);
}