import { Play, Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CheckMark } from '../../components/Checkbox';
import { Stamp } from '../../components/Stamp';
import { useDecor } from '../../state/Decor';
import { Thumbnail } from '../../components/Thumbnail';
import { itemCategory } from '../../lib/schedule';
import type { RoutineItem } from '../../types';

interface WorkoutCardProps {
  item: RoutineItem;
  index: number;
  done: boolean;
  onPlay: () => void;
  onToggleDone: () => void;
}

export function WorkoutCard({ item, index, done, onPlay, onToggleDone }: WorkoutCardProps) {
  const number = String(index + 1).padStart(2, '0');
  const kind = item.type === 'stretch' ? '스트레칭' : '운동';
  const { decor } = useDecor();
  // land the stamp only when it was just marked (not when the page opens)
  const wasDone = useRef(done);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (done && !wasDone.current) setLanded(true);
    if (!done) setLanded(false);
    wasDone.current = done;
  }, [done]);
  return (
    <article className={`wcard${done ? ' is-done' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
      <button type="button" className="wcard__main" onClick={onPlay} aria-label={`${item.title} 재생`}>
        <div className="wcard__media">
          <Thumbnail url={item.youtubeUrl} type={item.type} className="wcard__thumb" />
          <span className="wcard__play" aria-hidden="true">
            <Play size={15} strokeWidth={0} fill="currentColor" />
          </span>
          {item.durationMin ? (
            <span className="wcard__duration num" aria-hidden="true">
              {item.durationMin}분
            </span>
          ) : null}
        </div>
        <div className="wcard__body">
          <div className="wcard__eyebrow">
            <span className="wcard__index num">{number}</span>
            <span className={`wcard__type wcard__type--${item.type}`}>{kind}</span>
            {item.recurringId && (
              <span className="wcard__repeat">
                <Repeat size={11} strokeWidth={2.8} aria-hidden="true" /> 매주
              </span>
            )}
          </div>
          <h3 className="wcard__title">{item.title}</h3>
          <div className="wcard__meta">
            <span className="wcard__category">{itemCategory(item)}</span>
            {item.durationMin ? <span className="sr-only">, {item.durationMin}분</span> : null}
          </div>
        </div>
      </button>
      <button
        type="button"
        className={`wcard__check${done && decor.stamp.cards ? " has-stamp" : ""}`}
        onClick={onToggleDone}
        aria-pressed={done}
        aria-label={done ? `${item.title}: 완료됨. 탭하면 취소` : `${item.title} 완료로 표시`}
      >
        {done && decor.stamp.cards ? <Stamp size={96} seed={item.id} play={landed} /> : <CheckMark checked={done} size={30} />}
      </button>
    </article>
  );
}
