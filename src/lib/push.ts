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

// Values pasted from .env files often keep their quotes or a trailing newline
function readEnv(name: string) {
  return process.env[name]?.trim().replace(/^(['"])(.*)\1$/, '$2') || undefined;
}

/** Throws with a readable reason when the push keys or contact address are missing or malformed. */
function configure() {
  if (configured) return;
  const publicKey = readEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
  const privateKey = readEnv('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must both be set');
  }
  // Contact for the push services: a mailto: address or the app's https URL
  // (web-push rejects anything else, including http://localhost)
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const subject = [readEnv('VAPID_SUBJECT'), readEnv('AUTH_URL'), vercelUrl && `https://${vercelUrl}`].find(
    (value) => value?.startsWith('mailto:') || value?.startsWith('https:'),
  );
  if (!subject) {
    throw new Error('Set VAPID_SUBJECT to mailto:you@example.com');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * Sends to every saved device, or only one user's devices when userId is given.
 * Devices the push service reports as gone (404/410) are removed.
 */
export async function sendPush(payload: PushPayload, userId?: string) {
  configure();

  const subs = userId
    ? await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
    : await db.select().from(pushSubscriptions);

  const body = JSON.stringify({ ...payload, url: payload.url ?? '/dashboard' });
  const expired: string[] = [];
  let sent = 0;
  let lastError: string | undefined;

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
          lastError = `Push service returned ${status ?? 'an error'}: ${(error as Error).message}`;
        }
      }
    }),
  );

  if (expired.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  }

  return { sent, devices: subs.length, removed: expired.length, error: lastError };
}
