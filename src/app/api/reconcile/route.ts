import { db } from '@/lib/db';
import { unmatchedPayments, members } from '@/db/schema';
import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { getViewingSeason } from '@/lib/current-season';

export async function GET() {
  // Unmatched payments are one shared queue; only the members to assign them to are scoped
  const { season } = await getViewingSeason();
  const payments = await db
    .select()
    .from(unmatchedPayments)
    .orderBy(desc(unmatchedPayments.paymentDate));

  const membersList = await db
    .select()
    .from(members)
    .where(and(eq(members.isActive, true), eq(members.season, season)))
    .orderBy(members.lastName);

  return NextResponse.json({ payments, members: membersList });
}