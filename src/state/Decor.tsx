import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyAppIcon, DEFAULT_ICON } from '../lib/appIcon';
import { exportImages, imageUrl, importImages, pruneImages, clearImages, type ImageBackup } from '../lib/media';
import { buildPalette, DEFAULT_THEME, isDefaultTheme, type ThemeChoice } from '../lib/palette';
import { readJSON, writeJSON } from '../lib/storage';

export type DecorScreen = 'today' | 'calendar' | 'stats';
export const DECOR_SCREENS: { id: DecorScreen; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'calendar', label: '캘린더' },
  { id: 'stats', label: '통계' },
];

/** Position/size in "width units": fractions of the screen's content width (stable across rotation). */
export interface Sticker {
  id: string;
  imageId: string;
  x: number;
  y: number;
  w: number;
  /** height / width of the image */
  aspect: number;
  rot: number;
}

export interface ScreenBackground {
  imageId: string;
  /** px of blur on the picture */
  blur: number;
  /** 0–0.85: how much the page colour covers the picture (readability) */
  veil: number;
  /** frosted, see-through cards */
  glass: boolean;
}

export type StampColor = 'theme' | 'red' | 'navy' | 'black';

export interface StampSettings {
  kind: 'builtin' | 'custom';
  imageId?: string;
  /** rough, speckled ink */
  ink: boolean;
  /** paint the stamp one colour (off = original colours) */
  tint: boolean;
  color: StampColor;
  /** slightly different angle every time */
  tilt: boolean;
  /** "thump" when it lands */
  animate: boolean;
  /** stamp finished videos on Today's cards */
  cards: boolean;
  /** also stamp fully completed days in the calendar */
  calendar: boolean;
}

export interface DecorState {
  version: 1;
  theme: ThemeChoice;
  backgrounds: Partial<Record<DecorScreen, ScreenBackground>>;
  stickers: Partial<Record<DecorScreen, Sticker[]>>;
  stamp: StampSettings;
  /** custom home-screen icon (image id); default icon when missing */
  icon?: string;
}

export const DEFAULT_STAMP: StampSettings = {
  kind: 'builtin',
  ink: true,
  tint: false,
  color: 'theme',
  tilt: true,
  animate: true,
  cards: true,
  calendar: true,
};

const DEFAULT_DECOR: DecorState = {
  version: 1,
  theme: DEFAULT_THEME,
  backgrounds: {},
  stickers: {},
  stamp: DEFAULT_STAMP,
};

const KEY = 'dailyfit.decor.v1';
export const MAX_STICKERS = 20;

interface DecorContextValue {
  decor: DecorState;
  setTheme: (theme: ThemeChoice) => void;
  setBackground: (screen: DecorScreen, bg: ScreenBackground | null) => void;
  addSticker: (screen: DecorScreen, sticker: Sticker) => void;
  updateSticker: (screen: DecorScreen, id: string, patch: Partial<Sticker>) => void;
  removeSticker: (screen: DecorScreen, id: string) => void;
  setStamp: (patch: Partial<StampSettings>) => void;
  setIcon: (imageId: string | null) => void;
  resetDecor: () => void;
  /** screen whose stickers are being arranged right now */
  editing: DecorScreen | null;
  setEditing: (screen: DecorScreen | null) => void;
  exportDecor: () => Promise<{ decor: DecorState; images: ImageBackup[] }>;
  importDecor: (decor: unknown, images: unknown) => Promise<boolean>;
}

const DecorContext = createContext<DecorContextValue | null>(null);

function load(): DecorState {
  const saved = readJSON<Partial<DecorState>>(KEY, {});
  return {
    ...DEFAULT_DECOR,
    ...saved,
    theme: { ...DEFAULT_THEME, ...saved.theme },
    stamp: { ...DEFAULT_STAMP, ...saved.stamp },
    backgrounds: saved.backgrounds ?? {},
    stickers: saved.stickers ?? {},
    version: 1,
  };
}

function usedImageIds(d: DecorState): Set<string> {
  const ids = new Set<string>();
  Object.values(d.backgrounds).forEach((b) => b && ids.add(b.imageId));
  Object.values(d.stickers).forEach((list) => list?.forEach((s) => ids.add(s.imageId)));
  if (d.stamp.imageId) ids.add(d.stamp.imageId);
  if (d.icon) ids.add(d.icon);
  return ids;
}

/** Writes the theme's colours onto :root (default theme → the CSS file's own values). */
function applyTheme(theme: ThemeChoice) {
  const root = document.documentElement;
  const previous = (root.dataset.themeVars ?? '').split(',').filter(Boolean);
  previous.forEach((name) => root.style.removeProperty(name));
  if (isDefaultTheme(theme)) {
    delete root.dataset.themeVars;
  } else {
    const vars = buildPalette(theme);
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
    root.dataset.themeVars = Object.keys(vars).join(',');
  }
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#f4f4f5');
}

export function DecorProvider({ children }: { children: ReactNode }) {
  const [decor, setDecor] = useState<DecorState>(load);
  const [editing, setEditing] = useState<DecorScreen | null>(null);

  useEffect(() => void writeJSON(KEY, decor), [decor]);
  useEffect(() => applyTheme(decor.theme), [decor.theme]);
  useEffect(() => void applyAppIcon(decor.icon), [decor.icon]);

  // Drop pictures nothing uses any more (after a change settles).
  const usedKey = [...usedImageIds(decor)].sort().join(',');
  useEffect(() => {
    const t = window.setTimeout(() => void pruneImages(new Set(usedKey.split(',').filter(Boolean))), 1500);
    return () => clearTimeout(t);
  }, [usedKey]);

  const setTheme = useCallback((theme: ThemeChoice) => setDecor((d) => ({ ...d, theme })), []);

  const setBackground = useCallback((screen: DecorScreen, bg: ScreenBackground | null) => {
    setDecor((d) => {
      const backgrounds = { ...d.backgrounds };
      if (bg) backgrounds[screen] = bg;
      else delete backgrounds[screen];
      return { ...d, backgrounds };
    });
  }, []);

  const addSticker = useCallback((screen: DecorScreen, sticker: Sticker) => {
    setDecor((d) => ({ ...d, stickers: { ...d.stickers, [screen]: [...(d.stickers[screen] ?? []), sticker].slice(-MAX_STICKERS) } }));
  }, []);

  const updateSticker = useCallback((screen: DecorScreen, id: string, patch: Partial<Sticker>) => {
    setDecor((d) => ({
      ...d,
      stickers: { ...d.stickers, [screen]: (d.stickers[screen] ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s)) },
    }));
  }, []);

  const removeSticker = useCallback((screen: DecorScreen, id: string) => {
    setDecor((d) => ({ ...d, stickers: { ...d.stickers, [screen]: (d.stickers[screen] ?? []).filter((s) => s.id !== id) } }));
  }, []);

  const setStamp = useCallback((patch: Partial<StampSettings>) => setDecor((d) => ({ ...d, stamp: { ...d.stamp, ...patch } })), []);

  const setIcon = useCallback(
    (imageId: string | null) =>
      setDecor((d) => {
        const next = { ...d };
        if (imageId) next.icon = imageId;
        else delete next.icon;
        return next;
      }),
    [],
  );

  const resetDecor = useCallback(() => {
    setDecor(DEFAULT_DECOR);
    setEditing(null);
    void clearImages();
  }, []);

  const exportDecor = useCallback(async () => ({ decor, images: await exportImages(usedImageIds(decor)) }), [decor]);

  const importDecor = useCallback(async (data: unknown, images: unknown) => {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(images)) await importImages(images as ImageBackup[]);
    const d = data as Partial<DecorState>;
    setDecor({
      ...DEFAULT_DECOR,
      ...d,
      theme: { ...DEFAULT_THEME, ...d.theme },
      stamp: { ...DEFAULT_STAMP, ...d.stamp },
      backgrounds: d.backgrounds ?? {},
      stickers: d.stickers ?? {},
      version: 1,
    });
    return true;
  }, []);

  const value = useMemo(
    () => ({
      decor,
      setTheme,
      setBackground,
      addSticker,
      updateSticker,
      removeSticker,
      setStamp,
      setIcon,
      resetDecor,
      editing,
      setEditing,
      exportDecor,
      importDecor,
    }),
    [decor, setTheme, setBackground, addSticker, updateSticker, removeSticker, setStamp, setIcon, resetDecor, editing, exportDecor, importDecor],
  );

  return <DecorContext.Provider value={value}>{children}</DecorContext.Provider>;
}

export function useDecor(): DecorContextValue {
  const ctx = useContext(DecorContext);
  if (!ctx) throw new Error('useDecor must be used inside <DecorProvider>');
  return ctx;
}

/** Object URL of a stored image (null while loading / missing). */
export function useImageUrl(id: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!id) return;
    void imageUrl(id).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}

/** The app icon as shown in the app's own previews (custom picture or the default). */
export function useAppIconUrl(): string {
  const { decor } = useDecor();
  return useImageUrl(decor.icon) ?? DEFAULT_ICON;
}
