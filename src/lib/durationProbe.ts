/**
 * Measures video lengths without a paid API: one hidden, muted YouTube IFrame
 * player cues each unknown video (no playback, nothing downloaded) and reads
 * getDuration() once the metadata arrives.
 */
import { loadYouTubeApi, type YTPlayer } from './youtube';

type Listener = (videoId: string, seconds: number) => void;

const queue: string[] = [];
const seen = new Set<string>();
let listener: Listener | null = null;
let player: YTPlayer | null = null;
let ready: Promise<YTPlayer> | null = null;
let running = false;

function getPlayer(): Promise<YTPlayer> {
  if (ready) return ready;
  ready = loadYouTubeApi().then(
    (YT) =>
      new Promise<YTPlayer>((resolve) => {
        const host = document.createElement('div');
        host.setAttribute('aria-hidden', 'true');
        host.style.cssText =
          'position:fixed;left:-9999px;top:0;width:200px;height:113px;opacity:0;pointer-events:none;';
        const mount = document.createElement('div');
        host.appendChild(mount);
        document.body.appendChild(host);
        const p = new YT.Player(mount, {
          width: 200,
          height: 113,
          playerVars: { autoplay: 0, mute: 1, controls: 0, playsinline: 1, origin: window.location.origin },
          events: { onReady: () => resolve(p) },
        });
      }),
  );
  ready.catch(() => {
    ready = null;
  });
  return ready;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  if (running) return;
  running = true;
  try {
    player = await getPlayer();
    while (queue.length) {
      const id = queue.shift()!;
      player.cueVideoById({ videoId: id });
      let seconds = 0;
      for (let i = 0; i < 40 && !seconds; i++) {
        await wait(150);
        seconds = player.getDuration();
      }
      if (seconds > 0) listener?.(id, seconds);
      else seen.delete(id); // try again next time
    }
  } catch {
    // offline / blocked — lengths will be learned when the video plays
    queue.forEach((id) => seen.delete(id));
    queue.length = 0;
  } finally {
    running = false;
  }
}

export function setDurationListener(fn: Listener) {
  listener = fn;
}

/** Queue videos whose length is unknown. Safe to call repeatedly. */
export function probeDurations(videoIds: string[]) {
  let added = false;
  for (const id of videoIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(id);
    added = true;
  }
  if (added && navigator.onLine !== false) void run();
}
