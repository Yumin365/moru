import { useDecor, useImageUrl, type StampColor, type StampSettings } from '../state/Decor';
import './stamp.css';

const COLORS: Record<StampColor, { light: string; dark: string }> = {
  theme: { light: 'var(--accent)', dark: 'var(--accent-bright)' },
  red: { light: '#d23a2e', dark: '#ff7a6e' },
  navy: { light: '#243f8f', dark: '#9fb3ff' },
  black: { light: '#26262a', dark: '#f2f2f4' },
};

export const STAMP_COLOR_LABEL: Record<StampColor, string> = {
  theme: '테마색',
  red: '빨강',
  navy: '남색',
  black: '검정',
};

export function stampColor(color: StampColor, onDark = false): string {
  return COLORS[color][onDark ? 'dark' : 'light'];
}

/** Stable "random" angle for a given key, so a stamp never wobbles between renders. */
function tiltFor(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 25) - 15; // −15° … +9°, leaning left like a hand stamp
}

/** The built-in '참 잘했어요' stamp, drawn in currentColor. */
export function GoodJobMark() {
  return (
    <svg viewBox="0 0 120 120" className="stamp__svg" aria-hidden="true">
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* little stars on both sides */}
      <path d="M17 60 l3.2 -2.2 l1.3 -3.8 l1.3 3.8 l3.2 2.2 l-3.2 2.2 l-1.3 3.8 l-1.3 -3.8z" fill="currentColor" />
      <path d="M93 60 l3.2 -2.2 l1.3 -3.8 l1.3 3.8 l3.2 2.2 l-3.2 2.2 l-1.3 3.8 l-1.3 -3.8z" fill="currentColor" />
      {/* smile */}
      <path d="M48 36 q12 9 24 0" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <text x="60" y="66" textAnchor="middle" className="stamp__text stamp__text--big" fill="currentColor">
        참
      </text>
      <text x="60" y="90" textAnchor="middle" className="stamp__text" fill="currentColor">
        잘했어요
      </text>
    </svg>
  );
}

interface StampViewProps {
  settings: StampSettings;
  /** object URL of the custom picture (custom kind only) */
  imageUrl?: string | null;
  /** px, or any CSS length (height follows the width) */
  size: number | string;
  seed?: string;
  /** play the landing animation (still needs settings.animate) */
  play?: boolean;
  onDark?: boolean;
  /** draw in the surrounding text colour (stamps on filled calendar cells) */
  inherit?: boolean;
  className?: string;
}

/** Pure stamp renderer (used by the settings preview too). */
export function StampView({ settings, imageUrl, size, seed = '', play, onDark, inherit, className = '' }: StampViewProps) {
  const custom = settings.kind === 'custom' && imageUrl;
  const color = inherit ? undefined : stampColor(settings.color, onDark);
  const rot = settings.tilt ? tiltFor(seed || 'stamp') : 0;
  const cls = [
    'stamp',
    settings.ink && 'is-ink',
    play && settings.animate && 'is-landing',
    onDark && 'is-on-dark',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} style={{ width: size, color, ['--stamp-rot' as string]: `${rot}deg` }} aria-hidden="true">
      <span className="stamp__body">
        {custom ? (
          settings.tint ? (
            <span
              className="stamp__mask"
              style={{ WebkitMaskImage: `url("${imageUrl}")`, maskImage: `url("${imageUrl}")` }}
            />
          ) : (
            <img src={imageUrl} alt="" className="stamp__img" draggable={false} />
          )
        ) : (
          <GoodJobMark />
        )}
      </span>
    </span>
  );
}

interface StampProps {
  size: number | string;
  seed?: string;
  play?: boolean;
  onDark?: boolean;
  inherit?: boolean;
  className?: string;
}

/** The stamp as the user configured it in 꾸미기. */
export function Stamp(props: StampProps) {
  const { decor } = useDecor();
  const url = useImageUrl(decor.stamp.kind === 'custom' ? decor.stamp.imageId : null);
  return <StampView settings={decor.stamp} imageUrl={url} {...props} />;
}

/** Shared SVG filter for the rough ink texture (rendered once). */
export function StampInkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id="df-stamp-ink" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
        {/* wobbly edges */}
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough" />
        {/* speckles where the ink didn't take */}
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 2.2" result="holes" />
        <feComposite in="rough" in2="holes" operator="in" result="speckled" />
        {/* uneven pressure: some areas lighter */}
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="11" result="press" />
        <feColorMatrix in="press" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.1 0 0 0 1.62" result="pressure" />
        <feComposite in="speckled" in2="pressure" operator="in" />
      </filter>
    </svg>
  );
}
