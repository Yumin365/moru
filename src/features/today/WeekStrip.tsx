import { formatParts, weekOf } from '../../lib/date';
import { useStore } from '../../state/WorkoutStore';

interface WeekStripProps {
  todayKey: string;
  onSelect: (dateKey: string) => void;
}

/** This week at a glance; tap a day to open it in the calendar. */
export function WeekStrip({ todayKey, onSelect }: WeekStripProps) {
  const { getProgress, options, appStart } = useStore();
  const days = weekOf(todayKey, options.weekStartsOn);
  return (
    <div className="week" role="list" aria-label="이번 주">
      {days.map((key) => {
        const p = getProgress(key);
        const parts = formatParts(key);
        const isToday = key === todayKey;
        const cls = [
          'week__day',
          isToday && 'is-today',
          `is-${p.status}`,
          p.strength && 'is-strength',
          key < appStart && 'is-prestart',
        ]
          .filter(Boolean)
          .join(' ');
        const statusText =
          p.status === 'full' ? '완료' : p.status === 'partial' ? '일부 완료' : p.status === 'rest' ? '휴식일' : '';
        return (
          <button
            key={key}
            role="listitem"
            type="button"
            className={cls}
            onClick={() => onSelect(key)}
            aria-label={`${parts.label} ${parts.weekday}${statusText ? `, ${statusText}` : ''}`}
          >
            <span className="week__wd">{parts.weekdayShort}</span>
            <span className="week__num num">{parts.day}</span>
            <span className="week__dot" style={{ ['--p' as string]: `${Math.round(p.ratio * 100)}%` }} />
          </button>
        );
      })}
    </div>
  );
}
