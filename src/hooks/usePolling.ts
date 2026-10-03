import { useEffect, useRef } from 'react';

/**
 * Calls `refresh` every `intervalMs` while the page is visible, and once more
 * when it becomes visible again. Pausing while hidden lets Neon scale to zero
 * when nobody is looking.
 */
export function usePolling(refresh: () => unknown, intervalMs: number) {
  const latest = useRef(refresh);
  latest.current = refresh;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer === null) timer = setInterval(() => latest.current(), intervalMs);
    };
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        latest.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
}
