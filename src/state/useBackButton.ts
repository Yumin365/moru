import { useEffect, useRef } from 'react';

/**
 * Android / browser Back closes the top-most overlay (sheet, dialog, player)
 * instead of leaving the app.
 *
 * All overlays share ONE history entry: it is pushed when the first overlay opens
 * and removed (deferred a tick) when the last one closes, so closing one overlay
 * and opening another in the same render never races.
 */
type Entry = { id: number; close: () => void };

const stack: Entry[] = [];
let armed = false;
let ignoreNextPop = false;
let listening = false;
let nextId = 1;

function arm() {
  if (armed) return;
  history.pushState({ ...(history.state ?? {}), dailyFitOverlay: true }, '');
  armed = true;
}

/**
 * After a reload / app restore the browser may put us back on an overlay entry
 * from the previous visit. Clear its marker so it's treated as the base page.
 */
if (typeof history !== 'undefined' && (history.state as { dailyFitOverlay?: boolean } | null)?.dailyFitOverlay) {
  const { dailyFitOverlay: _stale, ...rest } = history.state as Record<string, unknown>;
  history.replaceState(Object.keys(rest).length ? rest : null, '');
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('popstate', () => {
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }
    if (!armed) return;
    armed = false;
    stack[stack.length - 1]?.close();
    // If overlays remain open (e.g. a sheet under the one just closed), re-arm.
    window.setTimeout(() => {
      if (stack.length) arm();
    }, 0);
  });
}

export function useBackButton(active: boolean, onBack: () => void) {
  const callback = useRef(onBack);
  callback.current = onBack;

  useEffect(() => {
    if (!active) return;
    listen();
    const entry: Entry = { id: nextId++, close: () => callback.current() };
    stack.push(entry);
    arm();
    return () => {
      const i = stack.findIndex((e) => e.id === entry.id);
      if (i >= 0) stack.splice(i, 1);
      window.setTimeout(() => {
        if (!stack.length && armed) {
          armed = false;
          ignoreNextPop = true;
          history.back();
        }
      }, 0);
    };
  }, [active]);
}
