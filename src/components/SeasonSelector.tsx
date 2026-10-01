'use client';
import { useEffect, useState } from 'react';

type SeasonInfo = { seasons: string[]; viewing: string; active: string };

/**
 * Per-user season menu. Viewing another season only changes what this user
 * sees; the active season (where imports go) is changed in Settings.
 */
export function SeasonSelector() {
  const [info, setInfo] = useState<SeasonInfo | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/view-season')
      .then((res) => (res.ok ? res.json() : null))
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info || info.seasons.length === 0) return null;

  const isPast = info.viewing !== info.active;

  const handleChange = async (season: string) => {
    setSwitching(true);
    try {
      // Choosing the active season clears the override, so this user follows
      // the active season when it changes next year
      await fetch('/api/view-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: season === info.active ? '' : season }),
      });
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  };

  return (
    <label
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${
        isPast ? 'border-flag-solid/50 bg-flag-solid/15 text-flag-line' : 'border-white/10 bg-white/5 text-neutral-300'
      }`}
      title={isPast ? `Viewing ${info.viewing}. The active season is ${info.active}.` : 'Season you are viewing'}
    >
      <span className="hidden sm:inline">{isPast ? 'Viewing' : 'Season'}</span>
      <select
        value={info.viewing}
        onChange={(e) => handleChange(e.target.value)}
        disabled={switching}
        aria-label="Season to view"
        className="cursor-pointer bg-transparent text-sm font-semibold normal-case tracking-normal text-white focus:outline-none disabled:opacity-60 [&>option]:text-black"
      >
        {info.seasons.map((season) => (
          <option key={season} value={season}>
            {season}{season === info.active ? ' (active)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
