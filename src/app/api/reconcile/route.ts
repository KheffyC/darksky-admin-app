import prisma from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const payments = await prisma.unmatchedPayment.findMany({
    orderBy: { paymentDate: 'asc'},
  });

  const members = await prisma.member.findMany({
    orderBy: { lastName: 'asc'},
  });

  return NextResponse.json({ payments, members });
}