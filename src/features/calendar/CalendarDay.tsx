import { Check } from 'lucide-react';
import { Stamp } from '../../components/Stamp';
import { useDecor } from '../../state/Decor';
import { useHighlight } from '../../state/useHighlight';
import { formatParts } from '../../lib/date';
import type { DayProgress } from '../../types';

interface CalendarDayProps {
  dateKey: string;
  progress: DayProgress;
  isToday: boolean;
  isSelected: boolean;
  /** before the first day the app was used — shown inactive */
  beforeStart?: boolean;
  onSelect: () => void;
}

/** Intensity level 0–3 for the heat-map shading. */
export function intensity(p: DayProgress): 0 | 1 | 2 | 3 {
  if (p.completed === 0) return 0;
  if (p.status === 'full') return 3;
  return p.ratio >= 0.5 ? 2 : 1;
}

export function CalendarDay({ dateKey, progress, isToday, isSelected, beforeStart, onSelect }: CalendarDayProps) {
  const parts = formatParts(dateKey);
  const { decor } = useDecor();
  const hl = useHighlight();
  if (beforeStart) {
    return (
      <span className="cday is-prestart" aria-label={`${parts.label}: 앱 시작 전`}>
        <span className="cday__num num">{parts.day}</span>
      </span>
    );
  }
  const level = intensity(progress);
  const cls = [
    'cday',
    `cday--l${level}`,
    `is-${progress.status}`,
    progress.strength && level > 0 && 'is-strength',
    isToday && 'is-today',
    isSelected && 'is-selected',
  ]
    .filter(Boolean)
    .join(' ');

  const desc =
    progress.status === 'future'
      ? '예정'
      : progress.status === 'rest'
        ? '휴식일'
        : progress.completed === 0
          ? '미완료'
          : `${progress.total}개 중 ${progress.completed}개 완료${progress.strength ? `, ${hl.name}` : ''}`;

  return (
    <button
      type="button"
      className={cls}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${parts.label}${isToday ? ' (오늘)' : ''}: ${desc}`}
    >
      <span className="cday__num num">{parts.day}</span>
      {level === 3 &&
        (decor.stamp.calendar ? (
          <Stamp size="112%" seed={dateKey} inherit />
        ) : (
          <span className="cday__check" aria-hidden="true">
            <Check size={11} strokeWidth={3.6} />
          </span>
        ))}
    </button>
  );
}
