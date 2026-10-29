import { Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CheckMark } from '../../components/Checkbox';
import { HighlightIcon } from '../../components/HighlightIcon';
import { Stamp } from '../../components/Stamp';
import { weekdaysLabel } from '../../lib/date';
import { useDecor } from '../../state/Decor';
import { useStore } from '../../state/WorkoutStore';
import type { RoutineItem } from '../../types';

interface TodoCardProps {
  item: RoutineItem;
  index: number;
  done: boolean;
  onEdit: () => void;
  onToggleDone: () => void;
}

/** A text-only routine item: tap the text to edit, the circle to check it off. */
export function TodoCard({ item, index, done, onEdit, onToggleDone }: TodoCardProps) {
  const { decor } = useDecor();
  const { recurring, highlight } = useStore();
  const linked = highlight.mode === 'todo' && Boolean(item.recurringId) && item.recurringId === highlight.ruleId;
  const rule = item.recurringId ? recurring.find((r) => r.id === item.recurringId) : undefined;
  const wasDone = useRef(done);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (done && !wasDone.current) setLanded(true);
    if (!done) setLanded(false);
    wasDone.current = done;
  }, [done]);
  const stamped = done && decor.stamp.cards;

  return (
    <article className={`wcard wcard--todo${done ? ' is-done' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
      <button type="button" className="wcard__main" onClick={onEdit} aria-label={`${item.title} 고치기`}>
        <div className="wcard__body">
          <div className="wcard__eyebrow">
            <span className="wcard__index num">{String(index + 1).padStart(2, '0')}</span>
            <span className="wcard__type wcard__type--todo">할 일</span>
            {linked && (
              <span className="wcard__hl">
                <HighlightIcon icon={highlight.icon} size={11} strokeWidth={2.8} /> 파란색 기록
              </span>
            )}
            {rule && (
              <span className="wcard__repeat">
                <Repeat size={11} strokeWidth={2.8} aria-hidden="true" /> {rule.weekdays.length === 7 ? '매일' : weekdaysLabel(rule.weekdays)}
              </span>
            )}
          </div>
          <h3 className="wcard__title">{item.title}</h3>
        </div>
      </button>
      <button
        type="button"
        className={`wcard__check${stamped ? ' has-stamp' : ''}`}
        onClick={onToggleDone}
        aria-pressed={done}
        aria-label={done ? `${item.title}: 완료됨. 탭하면 취소` : `${item.title} 완료로 표시`}
      >
        {stamped ? <Stamp size={64} seed={item.id} play={landed} /> : <CheckMark checked={done} size={30} />}
      </button>
    </article>
  );
}
