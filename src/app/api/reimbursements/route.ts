import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { reimbursements, users } from '@/db/schema';
import { getViewingSeason } from '@/lib/current-season';
import { parseReimbursementInput } from './validate';

// GET /api/reimbursements - All reimbursements for the viewing season, newest purchase first
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { season } = await getViewingSeason();
    const rows = await db
      .select({
        reimbursement: reimbursements,
        paidByFirstName: users.firstName,
        paidByLastName: users.lastName,
      })
      .from(reimbursements)
      .innerJoin(users, eq(users.id, reimbursements.paidBy))
      .where(eq(reimbursements.season, season))
      .orderBy(desc(reimbursements.purchasedOn), desc(reimbursements.createdAt));

    return NextResponse.json(
      rows.map(({ reimbursement, paidByFirstName, paidByLastName }) => ({
        ...reimbursement,
        paidByName: `${paidByFirstName} ${paidByLastName}`.trim(),
      })),
    );
  } catch (error) {
    console.error('Error fetching reimbursements:', error);
    return NextResponse.json({ error: 'Failed to fetch reimbursements' }, { status: 500 });
  }
}

// POST /api/reimbursements - Log an out-of-pocket purchase
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = parseReimbursementInput(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { season } = await getViewingSeason();
    const now = new Date().toISOString();
    const [row] = await db
      .insert(reimbursements)
      .values({
        id: crypto.randomUUID(),
        season,
        ...parsed,
        status: 'owed',
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error creating reimbursement:', error);
    return NextResponse.json({ error: 'Failed to save reimbursement' }, { status: 500 });
  }
}
