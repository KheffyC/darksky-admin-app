/** Today as YYYY-MM-DD in the viewer's timezone. */
export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** "Oct 5" from a YYYY-MM-DD date (pinned to noon so the day never shifts across timezones). */
export function formatShortDate(value: string | null | undefined) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** "just now", "5m ago", "3h ago", "Mon 9:14 AM", or "Oct 5" for older timestamps. */
export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return '';
  // Timestamps from the database have no zone and are stored in UTC
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 6) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 6) {
    return date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
