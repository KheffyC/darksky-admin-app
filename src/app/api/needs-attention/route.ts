import { NextResponse } from 'next/server';
import { getViewingSeason } from '@/lib/current-season';
import { getNeedsAttention } from '@/lib/needs-attention';
import { requireUserId } from '@/lib/session-user';

// GET /api/needs-attention - The Home page list for the viewing season
export async function GET() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { season } = await getViewingSeason();
    return NextResponse.json(await getNeedsAttention(season));
  } catch (error) {
    console.error('Error building needs-attention list:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}
