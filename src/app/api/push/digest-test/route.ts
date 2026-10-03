import { NextResponse } from 'next/server';
import { getViewingSeason } from '@/lib/current-season';
import { getNeedsAttention } from '@/lib/needs-attention';
import { buildDigest } from '@/lib/digest';
import { sendPush } from '@/lib/push';
import { requireUserId } from '@/lib/session-user';

// POST /api/push/digest-test - Send today's digest to your own devices now (always sends, even when all clear)
export async function POST() {
  const userId = await requireUserId();
  if (userId instanceof NextResponse) return userId;

  try {
    const { season } = await getViewingSeason();
    // Includes missed payments regardless of weekday so you can see the full message
    const digest = buildDigest(await getNeedsAttention(season), true) ?? {
      title: 'All clear today',
      body: 'Nothing needs attention. On days like this the real digest stays quiet.',
    };
    const result = await sendPush({ ...digest, url: '/dashboard' }, userId);
    return NextResponse.json({ ...digest, ...result });
  } catch (error) {
    console.error('Digest test failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Digest test failed' }, { status: 500 });
  }
}
