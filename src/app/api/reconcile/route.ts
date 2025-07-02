import { db } from '@/lib/db';
import { unmatchedPayments, members } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const payments = await db
    .select()
    .from(unmatchedPayments)
    .orderBy(unmatchedPayments.paymentDate);

  const membersList = await db
    .select()
    .from(members)
    .orderBy(members.lastName);

  return NextResponse.json({ payments, members: membersList });
}