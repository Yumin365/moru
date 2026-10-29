/**
 * Theme palettes. A theme is just two colours + a neutral tone; every other
 * token (hover/pressed, pale tints, on-dark variants, calendar shades, text
 * colours with guaranteed contrast) is derived here and written onto :root.
 */
import { contrast, deltaE, ensureContrast, hexToLch, lchToHex, rgbTriplet, withLightness } from './color';

export type NeutralTone = 'warm' | 'neutral' | 'cool';

export interface ThemeChoice {
  /** preset id, or 'custom' */
  preset: string;
  accent: string;
  secondary: string;
  neutral: NeutralTone;
}

export interface Preset {
  id: string;
  name: string;
  accent: string;
  secondary: string;
  neutral: NeutralTone;
}

export const DEFAULT_PRESET = 'plum';

export const PRESETS: Preset[] = [
  { id: 'plum', name: '플럼 · 아이리스', accent: '#a8357c', secondary: '#4766e4', neutral: 'neutral' },
  { id: 'lime', name: '라임', accent: '#c2e85a', secondary: '#6f5ff0', neutral: 'warm' },
  { id: 'coral', name: '코랄', accent: '#e0604c', secondary: '#2e8c99', neutral: 'warm' },
  { id: 'mint', name: '민트', accent: '#1f9e86', secondary: '#5468e0', neutral: 'cool' },
  { id: 'lavender', name: '라벤더', accent: '#7a5ae0', secondary: '#e0638f', neutral: 'cool' },
  { id: 'ocean', name: '오션', accent: '#2a6fdb', secondary: '#e07b35', neutral: 'neutral' },
  { id: 'mono', name: '모노', accent: '#2b2b31', secondary: '#8c8c96', neutral: 'neutral' },
];

export const DEFAULT_THEME: ThemeChoice = {
  preset: DEFAULT_PRESET,
  accent: PRESETS[0].accent,
  secondary: PRESETS[0].secondary,
  neutral: PRESETS[0].neutral,
};

const NEUTRALS: Record<NeutralTone, Record<string, string>> = {
  warm: {
    '--bg': '#f4f2ed',
    '--bg-deep': '#ebe8e1',
    '--surface-2': '#f8f7f4',
    '--fill': '#efede8',
    '--fill-strong': '#e4e1da',
    '--line': 'rgba(20, 22, 18, 0.07)',
    '--line-strong': 'rgba(20, 22, 18, 0.12)',
    '--ink': '#161513',
    '--ink-2': '#383632',
    '--muted': '#6e6b64',
    '--faint': '#a5a29b',
    '--on-dark': '#f7f6f2',
    '--on-dark-muted': 'rgba(247, 246, 242, 0.6)',
    '--dark': '#181714',
    '--dark-2': '#23221e',
    '--dark-3': '#2f2d29',
  },
  neutral: {
    '--bg': '#f4f4f5',
    '--bg-deep': '#e9e9eb',
    '--surface-2': '#f8f8f9',
    '--fill': '#eeeef0',
    '--fill-strong': '#e2e2e5',
    '--line': 'rgba(22, 22, 26, 0.07)',
    '--line-strong': 'rgba(22, 22, 26, 0.12)',
    '--ink': '#151517',
    '--ink-2': '#36363a',
    '--muted': '#6e6e74',
    '--faint': '#a4a4aa',
    '--on-dark': '#f6f6f7',
    '--on-dark-muted': 'rgba(246, 246, 247, 0.6)',
    '--dark': '#17171a',
    '--dark-2': '#222226',
    '--dark-3': '#2e2e33',
  },
  cool: {
    '--bg': '#f3f2f7',
    '--bg-deep': '#e9e7f0',
    '--surface-2': '#f8f7fb',
    '--fill': '#eeedf3',
    '--fill-strong': '#e2e0ea',
    '--line': 'rgba(24, 22, 38, 0.07)',
    '--line-strong': 'rgba(24, 22, 38, 0.12)',
    '--ink': '#15141b',
    '--ink-2': '#36343f',
    '--muted': '#6e6c7a',
    '--faint': '#a4a2af',
    '--on-dark': '#f6f5fa',
    '--on-dark-muted': 'rgba(246, 245, 250, 0.6)',
    '--dark': '#17161d',
    '--dark-2': '#22212a',
    '--dark-3': '#2e2d37',
  },
};

const WHITE = '#ffffff';

/** Colour family tokens for one hue (accent or secondary). */
function family(hex: string, dark: string, ink: string) {
  const { l } = hexToLch(hex);
  const onWhite = contrast(WHITE, hex) >= 4.5;
  const fg = onWhite ? WHITE : ensureContrast(withLightness(hex, 0.24, 0.6), hex, 6, 'darker');
  const hover = lchToHex({ ...hexToLch(hex), l: l - 0.04 });
  const press = lchToHex({ ...hexToLch(hex), l: l - 0.08 });
  const text = ensureContrast(hex, WHITE, 4.6, 'darker');
  const soft = withLightness(hex, 0.955, 0.3);
  const shade1 = withLightness(hex, 0.925, 0.42);
  const shade2 = withLightness(hex, 0.8, 0.75);
  const deep = ensureContrast(hex, shade2, 4.6, 'darker');
  const bright = ensureContrast(withLightness(hex, Math.max(l, 0.74), 0.9), dark, 5, 'lighter');
  const onDark = ensureContrast(withLightness(hex, 0.84, 0.55), dark, 6, 'lighter');
  return { fg, hover, press, text, soft, shade1, shade2, deep, bright, onDark, ink };
}

/** All CSS custom properties for a theme. */
export function buildPalette(theme: ThemeChoice): Record<string, string> {
  const neutrals = NEUTRALS[theme.neutral];
  const dark = neutrals['--dark'];
  const a = family(theme.accent, dark, neutrals['--ink']);
  const s = family(theme.secondary, dark, neutrals['--ink']);
  return {
    ...neutrals,
    '--accent': theme.accent,
    '--accent-hover': a.hover,
    '--accent-press': a.press,
    '--accent-ink': a.fg,
    '--accent-text': a.text,
    '--accent-soft': a.soft,
    '--accent-bright': a.bright,
    '--accent-rgb': rgbTriplet(theme.accent),
    '--accent-bright-rgb': rgbTriplet(a.bright),
    '--accent-1': a.shade1,
    '--accent-2': a.shade2,
    '--accent-3': theme.accent,
    '--accent-deep': a.deep,
    '--iris': theme.secondary,
    '--iris-text': s.text,
    '--iris-soft': s.soft,
    '--iris-rgb': rgbTriplet(theme.secondary),
    '--iris-1': s.shade1,
    '--iris-2': s.shade2,
    '--iris-3': theme.secondary,
    '--iris-deep': s.deep,
    '--iris-ink': s.fg,
    '--iris-on-dark': s.onDark,
  };
}

export interface ThemeWarning {
  message: string;
}

/** Friendly checks for custom colours. */
export function themeWarnings(theme: ThemeChoice): ThemeWarning[] {
  const out: ThemeWarning[] = [];
  if (deltaE(theme.accent, theme.secondary) < 15)
    out.push({ message: '두 색이 비슷해서 캘린더·차트에서 기록한 날과 파란색 기록을 구분하기 어려울 수 있어요.' });
  const bg = NEUTRALS[theme.neutral]['--bg'];
  if (contrast(theme.accent, bg) < 1.35) out.push({ message: '메인 색이 배경과 너무 비슷해서 진행 막대·체크가 잘 안 보일 수 있어요.' });
  return out;
}

export function isDefaultTheme(theme: ThemeChoice): boolean {
  return theme.preset === DEFAULT_PRESET;
}
