import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/** Keeps the screen on while working out (Screen Wake Lock API, where supported). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request('screen');
        if (disposed) void s.release();
        else sentinel = s;
      } catch {
        /* denied or not visible — fine */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
