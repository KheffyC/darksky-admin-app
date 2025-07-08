import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/db/schema';

export async function GET() {
  try {
    const result = await db.select().from(settings).orderBy(settings.season);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to load all seasons:', error);
    return NextResponse.json(
      { error: 'Failed to load seasons' },
      { status: 500 }
    );
  }
}
