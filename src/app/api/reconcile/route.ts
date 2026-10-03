import { db } from '@/lib/db';
import { unmatchedPayments, members, payments as matchedPayments } from '@/db/schema';
import { NextResponse } from 'next/server';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { getViewingSeason } from '@/lib/current-season';

/** "  Maria  RIVERA." and "maria rivera" are the same payer. */
function normalizeName(name: string | null | undefined) {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

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

  // Who each payer has already paid for this season, from payments matched earlier
  const history = await db
    .select({ customerName: matchedPayments.customerName, memberId: matchedPayments.memberId })
    .from(matchedPayments)
    .innerJoin(members, eq(members.id, matchedPayments.memberId))
    .where(
      and(
        eq(members.season, season),
        eq(members.isActive, true),
        eq(matchedPayments.isActive, true),
        isNotNull(matchedPayments.customerName),
      ),
    );

  const paidForByPayer = new Map<string, Map<string, number>>();
  for (const row of history) {
    const payer = normalizeName(row.customerName);
    if (!payer) continue;
    const counts = paidForByPayer.get(payer) ?? new Map<string, number>();
    counts.set(row.memberId, (counts.get(row.memberId) ?? 0) + 1);
    paidForByPayer.set(payer, counts);
  }

  return NextResponse.json({
    payments: payments.map((payment) => ({
      ...payment,
      // [{ memberId, count }], most frequent first
      payerHistory: [...(paidForByPayer.get(normalizeName(payment.customerName)) ?? new Map())]
        .map(([memberId, count]) => ({ memberId, count }))
        .sort((a, b) => b.count - a.count),
    })),
    members: membersList,
  });
}
