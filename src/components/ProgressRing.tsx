import type { ReactNode } from 'react';

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: ReactNode;
  label?: string;
}

/** SVG circular progress with a smooth transition. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  track = 'var(--fill)',
  color = 'var(--accent)',
  children,
  label,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          opacity={v === 0 ? 0 : 1}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="ring__center">{children}</div>}
    </div>
  );
}
