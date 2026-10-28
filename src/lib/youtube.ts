/** YouTube URL parsing, thumbnails and the IFrame Player API loader. */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-character video id from any common YouTube link:
 *   youtube.com/watch?v=ID, m.youtube.com/watch?v=ID, music.youtube.com/watch?v=ID
 *   youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID, youtube.com/live/ID,
 *   youtube-nocookie.com/embed/ID, youtube.com/v/ID — or a bare ID.
 * Returns null when nothing valid is found.
 */
export function parseYouTubeId(input: string | undefined | null): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '').toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    // tolerate malformed links like youtu.be/ID&t=43s
    const id = segments[0]?.split(/[&?#]/)[0];
    return id && ID_RE.test(id) ? id : null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (v && ID_RE.test(v)) return v;
    if (segments.length >= 2 && ['shorts', 'embed', 'live', 'v', 'e'].includes(segments[0])) {
      return ID_RE.test(segments[1]) ? segments[1] : null;
    }
  }
  return null;
}

/** Optional start time from `t=90`, `t=90s`, `t=1m30s` or `start=90` (also in malformed links). */
export function parseStartSeconds(input: string | undefined | null): number {
  if (!input) return 0;
  const t = input.match(/[?&#](?:t|start)=([0-9hms]+)/i)?.[1];
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

export type ThumbQuality = 'mq' | 'hq' | 'sd' | 'maxres';

/** mq = 320×180 (16:9, no letterbox), hq = 480×360, sd = 640×480, maxres = 1280×720 (may not exist). */
export function thumbnailUrl(videoId: string, quality: ThumbQuality = 'mq'): string {
  const file = { mq: 'mqdefault', hq: 'hqdefault', sd: 'sddefault', maxres: 'maxresdefault' }[quality];
  return `https://i.ytimg.com/vi/${videoId}/${file}.jpg`;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Best-effort title lookup through YouTube's free, key-less oEmbed endpoint. */
export async function fetchVideoTitle(videoId: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl(videoId))}`,
      { signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
}

// ── IFrame Player API ─────────────────────────────────────────────────────────

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId?: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number; target: YTPlayer }) => void;
        onAutoplayBlocked?: (e: { target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads https://www.youtube.com/iframe_api once. Safe to call many times. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      script.remove();
      reject(new Error('YouTube player could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
