import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existingMember = await db
    .select({ id: members.id, isActive: members.isActive })
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  if (existingMember.length === 0) {
    return NextResponse.json({ message: 'Member not found' }, { status: 404 });
  }

  if (!existingMember[0].isActive) {
    return NextResponse.json({ message: 'Member is already archived' }, { status: 200 });
  }

  await db
    .update(members)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(members.id, id));

  return NextResponse.json({ message: 'Member archived successfully' }, { status: 200 });
}