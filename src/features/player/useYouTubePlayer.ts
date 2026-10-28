import { useEffect, useRef, useState } from 'react';
import { loadYouTubeApi, type YTPlayer } from '../../lib/youtube';

export type PlayerStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error' | 'api-error';

interface Options {
  videoId: string | null;
  startSeconds?: number;
  onEnded: () => void;
  onDuration?: (seconds: number) => void;
}

const ERROR_TEXT: Record<number, string> = {
  2: 'YouTube 링크가 올바르지 않아요.',
  5: '이 영상은 앱 안에서 재생할 수 없어요.',
  100: '삭제되었거나 비공개로 전환된 영상이에요.',
  101: '영상 소유자가 다른 앱에서의 재생을 허용하지 않았어요.',
  150: '영상 소유자가 다른 앱에서의 재생을 허용하지 않았어요.',
};

/**
 * Official YouTube IFrame Player API, mounted imperatively so React never touches
 * the iframe. Switching `videoId` reuses the same player (keeps autoplay permission).
 */
export function useYouTubePlayer({ videoId, startSeconds = 0, onEnded, onDuration }: Options) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const callbacks = useRef({ onEnded, onDuration });
  callbacks.current = { onEnded, onDuration };
  const initial = useRef({ videoId, startSeconds });
  const latest = useRef({ videoId, startSeconds });
  latest.current = { videoId, startSeconds };

  // Create the player once.
  useEffect(() => {
    let cancelled = false;
    const mount = document.createElement('div');
    hostRef.current?.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const first = initial.current;
        loadedIdRef.current = first.videoId;
        playerRef.current = new YT.Player(mount, {
          width: '100%',
          height: '100%',
          videoId: first.videoId ?? undefined,
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            fs: 1,
            start: Math.floor(first.startSeconds ?? 0),
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              readyRef.current = true;
              setStatus('ready');
              // The user may have skipped ahead while the API was still loading.
              const want = latest.current;
              if (want.videoId !== loadedIdRef.current) {
                loadedIdRef.current = want.videoId;
                if (want.videoId) e.target.loadVideoById({ videoId: want.videoId, startSeconds: want.startSeconds });
              } else if (loadedIdRef.current) {
                e.target.playVideo();
              }
            },
            onStateChange: (e) => {
              switch (e.data) {
                case YT.PlayerState.PLAYING: {
                  setStatus('playing');
                  setAutoplayBlocked(false);
                  const d = e.target.getDuration();
                  if (d > 0) callbacks.current.onDuration?.(d);
                  break;
                }
                case YT.PlayerState.PAUSED:
                  setStatus('paused');
                  break;
                case YT.PlayerState.ENDED:
                  setStatus('ended');
                  callbacks.current.onEnded();
                  break;
              }
            },
            onError: (e) => {
              setStatus('error');
              setErrorText(ERROR_TEXT[e.data] ?? '지금은 이 영상을 재생할 수 없어요.');
            },
            onAutoplayBlocked: () => setAutoplayBlocked(true),
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('api-error');
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      readyRef.current = false;
      mount.remove();
    };
  }, []);

  // Switch videos.
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (videoId === loadedIdRef.current) return;
    loadedIdRef.current = videoId;
    setErrorText(null);
    try {
      if (!videoId) {
        playerRef.current.pauseVideo();
        return;
      }
      setStatus('loading');
      playerRef.current.loadVideoById({ videoId, startSeconds });
    } catch {
      /* player iframe already gone */
    }
  }, [videoId, startSeconds]);

  return {
    hostRef,
    status,
    errorText,
    autoplayBlocked,
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
  };
}
