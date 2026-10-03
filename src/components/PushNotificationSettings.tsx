'use client';

import { useEffect, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

type Status = 'loading' | 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!supported) {
        // iPhone only exposes push once the app is on the home screen
        setStatus(isIos() && !isInstalled() ? 'needs-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? 'on' : 'off');
    }
    check().catch((error) => {
      console.error('Push status check failed:', error);
      setStatus('unsupported');
    });
  }, []);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('Push keys are not configured on the server yet.');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('Could not save this device.');
      setStatus('on');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not turn on notifications.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus('off');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not turn off notifications.');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const result = await response.json().catch(() => ({ error: `Server returned ${response.status}` }));
      if (result.error) {
        setMessage(`Test failed: ${result.error}`);
      } else if (result.sent > 0) {
        setMessage(`Sent to ${result.sent} device${result.sent === 1 ? '' : 's'}.`);
      } else if (result.removed > 0) {
        setMessage('This device’s subscription had expired. Turn notifications off and on again.');
      } else {
        setMessage('No devices are saved for your account. Turn notifications off and on again.');
      }
    } catch {
      setMessage('Test failed: could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const buttonClass =
    'rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-full border border-line bg-ink p-2">
          <BellIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Phone notifications</p>
          <p className="text-xs text-muted">One morning digest, only when something needs attention</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-line pt-4 text-sm">
        {status === 'loading' && <p className="text-muted">Checking this device…</p>}

        {status === 'needs-install' && (
          <p className="text-muted">
            On iPhone, tap <span className="font-semibold text-ink">Share → Add to Home Screen</span>, open the app from
            there, and come back to this page to turn on notifications.
          </p>
        )}

        {status === 'unsupported' && <p className="text-muted">This browser doesn&apos;t support push notifications.</p>}

        {status === 'denied' && (
          <p className="text-muted">
            Notifications are blocked for this app. Allow them in your phone&apos;s Settings, then reload this page.
          </p>
        )}

        {status === 'off' && (
          <button type="button" onClick={enable} disabled={busy} className={`${buttonClass} w-full border-ink bg-ink text-white hover:bg-ink-hover`}>
            {busy ? 'Turning on…' : 'Enable notifications on this device'}
          </button>
        )}

        {status === 'on' && (
          <>
            <p className="font-semibold text-paid">On for this device</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={sendTest} disabled={busy} className={`${buttonClass} border-ink bg-ink text-white hover:bg-ink-hover`}>
                Send a test
              </button>
              <button type="button" onClick={disable} disabled={busy} className={`${buttonClass} border-line bg-white text-ink hover:border-ink`}>
                Turn off
              </button>
            </div>
          </>
        )}

        {message && <p className="text-muted">{message}</p>}
      </div>
    </div>
  );
}
