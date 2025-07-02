import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members, tuitionEditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { id: memberId } = await params;

  const payment = await db
    .insert(payments)
    .values({
      id: crypto.randomUUID(),
      memberId,
      amountPaid: body.amountPaid,
      paymentDate: new Date(body.paymentDate).toISOString(),
      isActive: true,
      note: body.note || 'manual',
      paymentMethod: body.paymentMethod,
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json(payment[0]);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = await params;
  const body = await req.json();
  const { tuitionAmount } = body;

  if (!tuitionAmount || tuitionAmount <= 0) {
    return NextResponse.json({ error: 'Invalid tuition amount' }, { status: 400 });
  }

  const member = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);
    
  if (member.length === 0) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const currentMember = member[0];
  const currentTuition = currentMember.tuitionAmount;
  
  // Return if the member's tuition amount is the same as the new amount
  // This prevents unnecessary updates and logs
  if (currentTuition === tuitionAmount) {
    return NextResponse.json({ message: 'No changes made to tuition amount' }, { status: 200 });
  }

  // Update the member's tuition amount
  const updatedMember = await db
    .update(members)
    .set({ tuitionAmount: tuitionAmount })
    .where(eq(members.id, memberId))
    .returning();

  // Log the tuition edit
  await db
    .insert(tuitionEditLogs)
    .values({
      id: crypto.randomUUID(),
      memberId,
      oldAmount: currentTuition,
      newAmount: tuitionAmount,
      editedBy: 'admin@example.com', // Replace with authenticated user later
    });

  return NextResponse.json(updatedMember[0]);
}