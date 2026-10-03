import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { digestLogs } from '@/db/schema';
import { getCurrentSeasonSettings } from '@/lib/current-season';
import { getNeedsAttention, pacificToday } from '@/lib/needs-attention';
import { buildDigest, isMissedPaymentMonday } from '@/lib/digest';
import { sendPush } from '@/lib/push';

const SEND_HOUR = 7; // 7 AM Pacific

/**
 * GET /api/cron/digest - Called by Vercel Cron (see vercel.json) twice each
 * morning in UTC so one run lands in the 7 AM Pacific hour in both standard
 * and daylight time. Sends at most once per Pacific day, and only when
 * something needs attention.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = pacificToday();
  if (now.hour !== SEND_HOUR) {
    return NextResponse.json({ skipped: `It is ${now.hour}:00 in Pacific time, not ${SEND_HOUR}:00` });
  }

  try {
    // Claim today first so a retried or overlapping run can't send twice
    const claimed = await db.insert(digestLogs).values({ date: now.date }).onConflictDoNothing().returning();
    if (claimed.length === 0) {
      return NextResponse.json({ skipped: 'Already ran today' });
    }

    const season = (await getCurrentSeasonSettings())?.season;
    if (!season) {
      return NextResponse.json({ skipped: 'No active season' });
    }

    const attention = await getNeedsAttention(season, now.date);
    const digest = buildDigest(attention, isMissedPaymentMonday(attention, now.weekday));
    if (!digest) {
      await db.update(digestLogs).set({ title: 'All clear', body: 'Nothing needed attention; no push sent' }).where(eq(digestLogs.date, now.date));
      return NextResponse.json({ sent: 0, reason: 'Nothing needs attention' });
    }

    const result = await sendPush({ ...digest, url: '/dashboard' });
    await db.update(digestLogs).set({ ...digest, sent: result.sent }).where(eq(digestLogs.date, now.date));
    return NextResponse.json({ ...digest, ...result });
  } catch (error) {
    console.error('Morning digest failed:', error);
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 });
  }
}
