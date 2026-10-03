'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/auth/PermissionGuard';
import { formatRelativeTime } from '@/lib/dates';
import { Sheet, inputClass, labelClass, labelTextClass, primaryButtonClass } from '@/components/ui/Sheet';

type Status = { connected: false } | { connected: true; address: string; lastSyncedAt: string | null; lastStatus: string | null };

const AUTO_SYNC_AFTER_MS = 6 * 60 * 60 * 1000;

function syncedAtMs(value: string | null) {
  if (!value) return 0;
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(' ', 'T')}Z`).getTime();
}

/** Link status for the Google calendar, with Sync now and (for admins) connect/unlink. */
export function GoogleCalendarBar({ onSynced }: { onSynced: () => void }) {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const autoSynced = useRef(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch('/api/calendar-sync');
    const next: Status | null = response.ok ? await response.json() : null;
    setStatus(next);
    return next;
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    const response = await fetch('/api/calendar-sync/run', { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || 'Sync failed');
    setSyncing(false);
    await loadStatus();
    onSynced();
  }, [loadStatus, onSynced]);

  useEffect(() => {
    loadStatus().then((next) => {
      // Catch up quietly when the page opens and the last sync is stale
      if (next?.connected && !autoSynced.current && Date.now() - syncedAtMs(next.lastSyncedAt) > AUTO_SYNC_AFTER_MS) {
        autoSynced.current = true;
        sync();
      }
    });
  }, [loadStatus, sync]);

  if (!status) return null;

  if (!status.connected) {
    if (!isAdmin) return null;
    return (
      <>
        <button
          type="button"
          onClick={() => setConnecting(true)}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong bg-white px-4 text-left hover:border-ink"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">Connect Google Calendar</span>
            <span className="block text-xs text-muted">Import rehearsals and shows automatically</span>
          </span>
          <span className="text-sm font-semibold text-ink">Set up</span>
        </button>
        {connecting && <ConnectSheet onClose={() => setConnecting(false)} onConnected={async () => { setConnecting(false); await loadStatus(); onSynced(); }} />}
      </>
    );
  }

  const failed = status.lastStatus?.startsWith('Failed');

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Google Calendar</p>
          <p className={`truncate text-xs ${failed ? 'text-behind' : 'text-muted'}`}>
            {syncing
              ? 'Syncing…'
              : failed
                ? status.lastStatus
                : status.lastSyncedAt
                  ? `Synced ${formatRelativeTime(status.lastSyncedAt)}${status.lastStatus ? ` · ${status.lastStatus}` : ''}`
                  : 'Not synced yet'}
          </p>
        </div>
        <div className="flex flex-none items-center gap-1">
          {isAdmin && (
            <button type="button" onClick={() => setConnecting(true)} className="min-h-[36px] px-2 text-xs font-semibold text-muted hover:text-ink">
              Settings
            </button>
          )}
          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold text-ink hover:border-ink disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync now
          </button>
        </div>
      </div>
      {error && !failed && <p className="px-1 text-xs text-behind">{error}</p>}
      {connecting && (
        <ConnectSheet
          address={status.address}
          onClose={() => setConnecting(false)}
          onConnected={async () => {
            setConnecting(false);
            await loadStatus();
            onSynced();
          }}
          onUnlinked={async () => {
            setConnecting(false);
            await loadStatus();
          }}
        />
      )}
    </div>
  );
}

function ConnectSheet({
  address,
  onClose,
  onConnected,
  onUnlinked,
}: {
  address?: string;
  onClose: () => void;
  onConnected: () => void;
  onUnlinked?: () => void;
}) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Sheet title={address ? 'Google Calendar' : 'Connect Google Calendar'} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          const response = await fetch('/api/calendar-sync', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icsUrl: url }),
          });
          const result = await response.json().catch(() => ({}));
          setSaving(false);
          if (response.ok) onConnected();
          else setError(result.error || 'Could not connect');
        }}
        className="space-y-4"
      >
        {address && (
          <p className="rounded-xl bg-canvas px-3 py-2 text-sm text-muted">
            Linked to <span className="font-mono text-ink">{address}</span>. Paste a new address below to replace it.
          </p>
        )}
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>On a computer, open Google Calendar → <span className="font-semibold text-ink">Settings</span>.</li>
          <li>Under &ldquo;Settings for my calendars,&rdquo; pick the Dark Sky calendar.</li>
          <li>
            Scroll to <span className="font-semibold text-ink">Integrate calendar</span> and copy{' '}
            <span className="font-semibold text-ink">Secret address in iCal format</span>.
          </li>
        </ol>
        <label className={labelClass}>
          <span className={labelTextClass}>Secret iCal address</span>
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
            className={inputClass}
          />
        </label>
        <p className="text-xs text-muted">
          Name, date, times, and place come from Google and update on every sync. Event types and show-day details you add here
          are never overwritten.
        </p>
        {error && <p className="text-sm text-behind">{error}</p>}
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Connecting and importing…' : address ? 'Replace and sync' : 'Connect and import'}
        </button>
        {address && onUnlinked && (
          <button
            type="button"
            onClick={async () => {
              if (confirm('Stop syncing with Google Calendar? Events already imported stay on the calendar.')) {
                await fetch('/api/calendar-sync', { method: 'DELETE' });
                onUnlinked();
              }
            }}
            className="min-h-[44px] w-full text-sm font-semibold text-behind"
          >
            Unlink calendar
          </button>
        )}
      </form>
    </Sheet>
  );
}
