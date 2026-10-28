import type { RoutineItem } from '../../types';

interface SegmentedProgressProps {
  items: RoutineItem[];
  currentIndex: number;
  doneIds: Set<string>;
  onSelect?: (index: number) => void;
}

/** ● ━━━ ○ ━━━ ○ — one segment per video in the session (tap to jump). */
export function SegmentedProgress({ items, currentIndex, doneIds, onSelect }: SegmentedProgressProps) {
  return (
    <div className="segments" role="list" aria-label="운동 진행 단계">
      {items.map((item, i) => {
        const state = doneIds.has(item.id) ? 'done' : i === currentIndex ? 'current' : 'todo';
        return (
          <button
            key={item.id}
            type="button"
            role="listitem"
            className={`segments__item is-${state}${i === currentIndex ? ' is-active' : ''}`}
            onClick={() => onSelect?.(i)}
            aria-label={`${i + 1}. ${item.title}${state === 'done' ? ' (완료)' : ''}${i === currentIndex ? ' — 재생 중' : ''}`}
            aria-current={i === currentIndex ? 'step' : undefined}
          >
            <span className="segments__bar" />
          </button>
        );
      })}
    </div>
  );
}
