import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
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
          ...member,
          payments: [],
          tuitionAmount: member.tuitionAmount,
        });
      }
      
      if (payment) {
        memberMap.get(member.id).payments.push({
          amountPaid: payment.amountPaid
        });
      }
    });

    // Calculate totals for each member
    const membersWithTotals = Array.from(memberMap.values()).map(member => {
      const totalPaid = member.payments.reduce((sum: number, payment: any) => sum + payment.amountPaid, 0);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, section, season, tuitionAmount } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !season) {
      return new NextResponse('Missing required fields: firstName, lastName, email, and season are required', { status: 400 });
    }

    // Check if email already exists
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingMember.length > 0) {
      return new NextResponse('A member with this email already exists', { status: 409 });
    }

    // Create new member
    const newMember = await db
      .insert(members)
      .values({
        id: crypto.randomUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        section: section?.trim() || null,
        season: season.trim(),
        tuitionAmount: parseFloat(tuitionAmount) || 1000, // Default tuition amount
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMember[0]);
  } catch (error) {
    console.error('Failed to create member:', error);
    return new NextResponse('Failed to create member', { status: 500 });
  }
}
