import { db } from '@/lib/db';
import { unmatchedPayments, members } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const payments = await db
    .select()
    .from(unmatchedPayments)
    .orderBy(desc(unmatchedPayments.paymentDate));

  const membersList = await db
    .select()
    .from(members)
    .where(eq(members.isActive, true))
    .orderBy(members.lastName);

  return NextResponse.json({ payments, members: membersList });
}