/** Tiny, failure-tolerant localStorage wrapper (private mode / quota errors never crash the app). */

export const STORAGE_KEYS = {
  records: 'dailyfit.records.v1',
  routines: 'dailyfit.routines.v1',
  prefs: 'dailyfit.prefs.v1',
  videoMeta: 'dailyfit.videoMeta.v1',
  imported: 'dailyfit.imported.v1',
  recurring: 'dailyfit.recurring.v1',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}
