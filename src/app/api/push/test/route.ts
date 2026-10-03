import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendPush } from '@/lib/push';

// POST /api/push/test - Send a test notification to the signed-in user's devices
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendPush(
    {
      title: 'Notifications are on',
      body: 'The morning digest will show up here when something needs attention.',
      url: '/dashboard',
    },
    session.user.id,
  );

  return NextResponse.json(result);
}
