import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { reimbursements } from '@/db/schema';
import { deleteFile } from '@/lib/files';
import { isDate, parseReimbursementInput } from '../validate';

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/reimbursements/[id]
 * - { action: 'reimburse', reimbursedOn, reimbursedMethod } marks it paid back
 * - { action: 'reopen' } moves it back to owed
 * - otherwise the body is a full edit of the purchase details
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const [existing] = await db.select().from(reimbursements).where(eq(reimbursements.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
    }

    let changes: Partial<typeof reimbursements.$inferInsert>;
    if (body.action === 'reimburse') {
      if (!isDate(body.reimbursedOn)) {
        return NextResponse.json({ error: 'Date paid back is required' }, { status: 400 });
      }
      const method = typeof body.reimbursedMethod === 'string' ? body.reimbursedMethod.trim() : '';
      changes = { status: 'reimbursed', reimbursedOn: body.reimbursedOn, reimbursedMethod: method || null };
    } else if (body.action === 'reopen') {
      changes = { status: 'owed', reimbursedOn: null, reimbursedMethod: null };
    } else {
      const parsed = parseReimbursementInput(body);
      if ('error' in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      changes = parsed;
    }

    const [row] = await db
      .update(reimbursements)
      .set({ ...changes, updatedAt: new Date().toISOString() })
      .where(eq(reimbursements.id, id))
      .returning();

    // A replaced or removed receipt photo is no longer referenced anywhere
    if ('receiptPath' in changes && existing.receiptPath !== row.receiptPath) {
      await deleteFile(existing.receiptPath);
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error('Error updating reimbursement:', error);
    return NextResponse.json({ error: 'Failed to update reimbursement' }, { status: 500 });
  }
}

// DELETE /api/reimbursements/[id] - Remove it and its receipt photo
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const [deleted] = await db.delete(reimbursements).where(eq(reimbursements.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 });
    }
    await deleteFile(deleted.receiptPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reimbursement:', error);
    return NextResponse.json({ error: 'Failed to delete reimbursement' }, { status: 500 });
  }
}
