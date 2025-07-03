import { db } from '@/lib/db';
import { unmatchedPayments, members } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  const payments = await db
    .select()
    .from(unmatchedPayments)
    .orderBy(desc(unmatchedPayments.paymentDate));

  const membersList = await db
    .select()
    .from(members)
    .orderBy(members.lastName);

  return NextResponse.json({ payments, members: membersList });
}