import webpush from 'web-push';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/db/schema';

export type PushPayload = {
  title: string;
  body: string;
  // Where tapping the notification opens; defaults to the home dashboard
  url?: string;
};

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error('Push not configured: NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required');
    return false;
  }
  // Contact for the push services: a mailto: or the app's https URL
  const subject = process.env.VAPID_SUBJECT || process.env.AUTH_URL;
  if (!subject) {
    console.error('Push not configured: set VAPID_SUBJECT (mailto:you@example.com) or AUTH_URL');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Sends to every saved device, or only one user's devices when userId is given.
 * Devices the push service reports as gone (404/410) are removed.
 */
export async function sendPush(payload: PushPayload, userId?: string) {
  if (!configure()) return { sent: 0, failed: 0 };

  const subs = userId
    ? await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
    : await db.select().from(pushSubscriptions);

  const body = JSON.stringify({ ...payload, url: payload.url ?? '/dashboard' });
  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 * 12 },
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expired.push(sub.id);
        } else {
          console.error('Push send failed:', status, error);
        }
      }
    }),
  );

  if (expired.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  }

  return { sent, failed: subs.length - sent };
}
