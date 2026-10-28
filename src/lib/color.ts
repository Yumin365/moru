/** Small colour toolkit: hex ↔ sRGB ↔ OKLab/OKLCH, WCAG contrast, perceptual distance. */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function isHex(value: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ── OKLab / OKLCH ─────────────────────────────────────────
type Lab = [number, number, number];

function rgbToOklab(rgb: RGB): Lab {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export interface Lch {
  l: number; // 0..1
  c: number; // ~0..0.37
  h: number; // degrees
}

export function hexToLch(hex: string): Lch {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l: L, c: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

/** OKLCH → hex, reducing chroma until the colour fits in sRGB. */
export function lchToHex({ l, c, h }: Lch): string {
  const rad = (h * Math.PI) / 180;
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklabToRgb([l, chroma * Math.cos(rad), chroma * Math.sin(rad)]);
    if (rgb.every((v) => v >= -0.5 && v <= 255.5)) return rgbToHex(rgb);
    chroma *= 0.9;
  }
  return rgbToHex(oklabToRgb([l, 0, 0]));
}

/** Same hue & chroma family at a different lightness (chroma optionally scaled). */
export function withLightness(hex: string, l: number, chromaScale = 1): string {
  const c = hexToLch(hex);
  return lchToHex({ l, c: c.c * chromaScale, h: c.h });
}

/** Perceptual distance (OKLab ΔE × 100). */
export function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = rgbToOklab(hexToRgb(a));
  const [l2, a2, b2] = rgbToOklab(hexToRgb(b));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100;
}

/** Darkens (or lightens) until the colour reaches `target` contrast against `bg`. */
export function ensureContrast(hex: string, bg: string, target: number, direction: 'darker' | 'lighter'): string {
  const base = hexToLch(hex);
  let l = base.l;
  for (let i = 0; i < 60; i++) {
    const candidate = lchToHex({ ...base, l });
    if (contrast(candidate, bg) >= target) return candidate;
    l += direction === 'darker' ? -0.015 : 0.015;
    if (l <= 0 || l >= 1) break;
  }
  return lchToHex({ ...base, l: Math.min(0.98, Math.max(0.05, l)) });
}

export function rgbTriplet(hex: string): string {
  return hexToRgb(hex).join(', ');
}
