import { useEffect, useRef } from 'react';

/** Live theme colours (custom themes change these at runtime). */
function themeColors(): string[] {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return [v('--accent', '#a8357c'), v('--accent-2', '#d99bc4'), v('--iris', '#4766e4'), v('--iris-2', '#9daef1'), '#ff7a2f', v('--dark', '#17171a')];
}

/** Short, tasteful confetti burst drawn on a canvas (≈1.6s). Skipped for reduced motion. */
export function Confetti({ duration = 1600 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const W = canvas.width;
    const H = canvas.height;

    const COLORS = themeColors();
    const pieces = Array.from({ length: 110 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? W * 0.12 : W * 0.88,
        y: H * 0.42,
        vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 7) * dpr,
        vy: -(7 + Math.random() * 9) * dpr,
        w: (5 + Math.random() * 6) * dpr,
        h: (8 + Math.random() * 8) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[i % COLORS.length],
        round: Math.random() < 0.3,
      };
    });

    const start = performance.now();
    let frame = 0;
    const draw = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      const fade = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.6) / (duration * 0.4));
      ctx.globalAlpha = fade;
      for (const p of pieces) {
        p.vy += 0.32 * dpr;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
        }
        ctx.restore();
      }
      if (elapsed < duration) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
