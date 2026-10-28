/**
 * Small platform marks for tab labels (lucide has no brand icons).
 * Each viewBox is centred on the glyph's real bounds so it sits optically centred next to text.
 */
interface IconProps {
  size?: number;
}

/** Android robot head. */
export function AndroidIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="2 0.6 20 20" aria-hidden="true">
      <path d="M7.2 4.2 8.9 7M16.8 4.2 15.1 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M3 17a9 9 0 0 1 18 0zM9.6 12.8a1.1 1.1 0 1 0-2.2 0 1.1 1.1 0 1 0 2.2 0zM16.6 12.8a1.1 1.1 0 1 0-2.2 0 1.1 1.1 0 1 0 2.2 0z"
      />
    </svg>
  );
}

/** Apple mark (for iPhone). */
export function AppleIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="1.4 2.2 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.6-1-2.7-4.1zM14 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"
      />
    </svg>
  );
}

/** YouTube play-button mark (red, like the real logo). */
export function YouTubeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 24 17.3" aria-hidden="true">
      <path
        fill="#ff0033"
        d="M23.5 2.7A3 3 0 0 0 21.4.6C19.5 0 12 0 12 0S4.5 0 2.6.6A3 3 0 0 0 .5 2.7C0 4.6 0 8.65 0 8.65s0 4.05.5 5.95a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.95.5-5.95s0-4.05-.5-5.95z"
      />
      <path fill="#fff" d="M9.6 12.35 15.85 8.65 9.6 4.95z" />
    </svg>
  );
}
