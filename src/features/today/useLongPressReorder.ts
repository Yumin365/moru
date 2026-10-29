import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const HOLD_MS = 380;
const SLOP = 8; // px a finger may wander before the press counts as a scroll
const EDGE = 90; // px from the screen edge where the list auto-scrolls

interface DragState {
  id: string;
  from: number;
  to: number;
  /** how far the lifted card moved (page px) */
  dy: number;
}

interface Pending {
  id: string;
  index: number;
  x: number;
  y: number;
  timer: number;
}

/**
 * Long-press a card, then drag it up or down. Other cards slide out of the way;
 * the new order is reported on release. Scrolling is untouched until the hold
 * fires, so a normal swipe still scrolls the page.
 */
export function useLongPressReorder(ids: string[], onReorder: (ids: string[]) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pending = useRef<Pending | null>(null);
  const live = useRef<{ startY: number; pointerY: number; centers: number[]; sizes: number[]; gap: number } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const raf = useRef(0);
  dragRef.current = drag;

  const measure = () => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>(':scope > [data-sort-id]') ?? [])];
    const rects = items.map((el) => el.getBoundingClientRect());
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0;
    return {
      centers: rects.map((r) => r.top + window.scrollY + r.height / 2),
      sizes: rects.map((r) => r.height),
      gap,
    };
  };

  const targetIndex = (from: number, dy: number) => {
    const l = live.current!;
    const center = l.centers[from] + dy;
    let to = from;
    for (let k = from + 1; k < l.centers.length; k++) if (l.centers[k] < center) to = k;
    for (let k = from - 1; k >= 0; k--) if (l.centers[k] > center) to = k;
    return to;
  };

  const update = useCallback(() => {
    const d = dragRef.current;
    const l = live.current;
    if (!d || !l) return;
    const dy = l.pointerY + window.scrollY - l.startY;
    const to = targetIndex(d.from, dy);
    if (dy !== d.dy || to !== d.to) setDrag({ ...d, dy, to });
  }, []);

  const autoScroll = useCallback(() => {
    const l = live.current;
    if (!dragRef.current || !l) return;
    const y = l.pointerY;
    const step = y < EDGE ? -Math.ceil((EDGE - y) / 6) : y > window.innerHeight - EDGE - 70 ? Math.ceil((y - (window.innerHeight - EDGE - 70)) / 6) : 0;
    if (step) {
      window.scrollBy(0, step);
      update();
    }
    raf.current = requestAnimationFrame(autoScroll);
  }, [update]);

  const finish = useCallback(
    (commit: boolean) => {
      const d = dragRef.current;
      cancelAnimationFrame(raf.current);
      live.current = null;
      setDrag(null);
      if (!d) return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 50);
      if (commit && d.to !== d.from) {
        const next = [...ids];
        const [moved] = next.splice(d.from, 1);
        next.splice(d.to, 0, moved);
        onReorder(next);
      }
    },
    [ids, onReorder],
  );

  // Chrome only lets a touch gesture's moves be cancelled if a non-passive
  // listener was already there when the finger went down — so keep one on the list.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (dragRef.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, [ids.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // while a card is lifted: follow the finger, stop the page from scrolling
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      if (live.current) live.current.pointerY = e.clientY;
      update();
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    const block = (e: TouchEvent) => e.cancelable && e.preventDefault();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && cancel();
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('keydown', key);
    raf.current = requestAnimationFrame(autoScroll);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', cancel);
      document.removeEventListener('touchmove', block);
      document.removeEventListener('keydown', key);
      cancelAnimationFrame(raf.current);
    };
  }, [drag !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearPending = () => {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
  };

  const bind = (id: string, index: number) => ({
    'data-sort-id': id,
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.button !== 0 || ids.length < 2) return;
      clearPending();
      const { clientX: x, clientY: y } = e;
      const timer = window.setTimeout(() => {
        pending.current = null;
        const m = measure();
        live.current = { startY: y + window.scrollY, pointerY: y, ...m };
        navigator.vibrate?.(12);
        setDrag({ id, from: index, to: index, dy: 0 });
      }, HOLD_MS);
      pending.current = { id, index, x, y, timer };
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const p = pending.current;
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP) clearPending();
    },
    onPointerUp: clearPending,
    onPointerCancel: clearPending,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    // a release right after dragging must not also play / edit the card
    onClickCapture: (e: React.MouseEvent) => {
      if (suppressClick.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
  });

  /** inline style for the card at `index` while something is being dragged */
  const styleFor = (index: number): React.CSSProperties | undefined => {
    const l = live.current;
    if (!drag || !l) return undefined;
    if (index === drag.from) return { transform: `translateY(${drag.dy}px)`, zIndex: 3 };
    const shift = l.sizes[drag.from] + l.gap;
    if (drag.to > drag.from && index > drag.from && index <= drag.to) return { transform: `translateY(${-shift}px)` };
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return { transform: `translateY(${shift}px)` };
    return { transform: 'translateY(0)' };
  };

  return { listRef, bind, styleFor, dragging: drag?.id ?? null };
}
