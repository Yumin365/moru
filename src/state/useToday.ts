import { useEffect, useState } from 'react';
import { isValidDateKey, msUntilMidnight, toDateKey } from '../lib/date';

/**
 * Optional `?date=YYYY-MM-DD` in the URL pretends that day is today
 * (handy for checking another day's plan). Without it, the real local date is used.
 */
function overrideDate(): string | null {
  try {
    const value = new URLSearchParams(window.location.search).get('date');
    return value && isValidDateKey(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Today's local date key. Rolls over automatically at midnight and re-checks
 * whenever the app comes back to the foreground (PWAs are often resumed, not reloaded).
 */
export function useToday(): { todayKey: string; now: Date } {
  const [now, setNow] = useState(() => new Date());
  const override = overrideDate();

  useEffect(() => {
    let timer: number;
    const refresh = () => setNow(new Date());
    const schedule = () => {
      timer = window.setTimeout(() => {
        refresh();
        schedule();
      }, msUntilMidnight(new Date()));
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    // keep the greeting (morning/afternoon) fresh too
    const tick = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return { todayKey: override ?? toDateKey(now), now };
}
