/** Browser Fullscreen API helpers (best effort — e.g. iPhone Safari doesn't support it for pages). */
type FsDocument = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

/** Must be called directly inside a tap/click handler. */
export function enterFullscreen(): void {
  const doc = document as FsDocument;
  if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
  const el = document.documentElement as FsElement;
  try {
    const result = el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.();
    void result?.catch?.(() => {});
  } catch {
    /* not allowed — the player still fills the window */
  }
}

export function exitFullscreen(): void {
  const doc = document as FsDocument;
  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return;
  try {
    const result = doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.();
    void result?.catch?.(() => {});
  } catch {
    /* ignore */
  }
}
