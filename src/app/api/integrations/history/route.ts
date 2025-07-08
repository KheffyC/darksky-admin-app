import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const logs = await db.select().from(importLogs)
      .orderBy(desc(importLogs.startedAt))
      .limit(10);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch import history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import history' },
      { status: 500 }
    );
  }
}
