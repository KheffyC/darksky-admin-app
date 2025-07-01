import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const memberId = String(params.id);

  const payment = await prisma.payment.create({
    data: {
      member: { connect: { id: memberId } },
      amountPaid: body.amountPaid,
      paymentDate: new Date(body.paymentDate),
      isActive: true,
      note: body.note || 'manual',
      paymentMethod: body.paymentMethod, // Ensure this is provided in the request body
    },
  });

  return NextResponse.json(payment);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const memberId = params.id;
  const body = await req.json();
  const { tuitionAmount } = body;

  if (!tuitionAmount || tuitionAmount <= 0) {
    return NextResponse.json({ error: 'Invalid tuition amount' }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Return if the member's tuition amount is the same as the new amount
  // This prevents unnecessary updates and logs
  if (member.tuitionAmount === tuitionAmount) {
    return NextResponse.json({ message: 'No changes made to tuition amount' }, { status: 200 });
  }

  // Update the member's tuition amount
  const updatedMember = await prisma.member.update({
    where: { id: memberId },
    data: { tuitionAmount },
  });

  // Log the tuition edit
  await prisma.tuitionEditLog.create({
    data: {
      memberId,
      oldAmount: member.tuitionAmount,
      newAmount: tuitionAmount,
      editedBy: 'admin@example.com', // Replace with authenticated user later
    },
  });

  return NextResponse.json(updatedMember);
}