import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  days: number;
  variant?: 'pill' | 'compact';
}

export function StreakBadge({ days, variant = 'pill' }: StreakBadgeProps) {
  const active = days > 0;
  return (
    <div
      className={`streak streak--${variant}${active ? ' is-active' : ''}`}
      aria-label={`${days}일 연속 운동`}
      role="img"
    >
      <Flame size={variant === 'compact' ? 16 : 18} strokeWidth={2.4} className="streak__flame" aria-hidden="true" />
      <span className="streak__num num">{days}</span>
      {variant === 'pill' && <span className="streak__label">일 연속</span>}
    </div>
  );
}
