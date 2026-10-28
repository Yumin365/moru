import { Check, Dumbbell, ListVideo, Moon, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CheckMark, Toggle } from '../../components/Checkbox';
import { formatParts } from '../../lib/date';
import { itemCategory } from '../../lib/schedule';
import { useStore } from '../../state/WorkoutStore';

interface DayDetailProps {
  dateKey: string;
  onEditRoutine: (dateKey: string) => void;
}

function statusChip(status: string, completed: number, total: number) {
  switch (status) {
    case 'full':
      return <span className="chip chip--accent"><Check size={12} strokeWidth={3.4} /> 완료</span>;
    case 'partial':
      return <span className="chip chip--accent">{total}개 중 {completed}개</span>;
    case 'rest':
      return <span className="chip"><Moon size={12} strokeWidth={2.6} /> 휴식일</span>;
    case 'future':
      return <span className="chip">예정</span>;
    default:
      return <span className="chip">미완료</span>;
  }
}

/** Selected day's videos and record; "Edit" unlocks the toggles (prevents accidental taps). */
export function DayDetail({ dateKey, onEditRoutine }: DayDetailProps) {
  const { getPlan, getProgress, records, setItemDone, setStrength, todayKey } = useStore();
  const [editing, setEditing] = useState(false);
  const plan = getPlan(dateKey);
  const progress = getProgress(dateKey);
  const record = records[dateKey];
  const parts = formatParts(dateKey);
  const isFuture = dateKey > todayKey;
  const finishedAt = record?.finishedAt ? new Date(record.finishedAt) : null;

  useEffect(() => setEditing(false), [dateKey]);

  return (
    <section className={`daydetail card${editing ? ' is-editing' : ''}`} aria-live="polite">
      <header className="daydetail__head">
        <div>
          <div className="daydetail__date">
            <span className="num">{parts.month}</span>
            <span className="date-unit">월</span> <span className="num">{parts.day}</span>
            <span className="date-unit">일</span>
          </div>
          <div className="daydetail__weekday">
            {parts.weekday}
            {dateKey === todayKey ? ' · 오늘' : ''}
          </div>
        </div>
        <div className="daydetail__status">
          {statusChip(progress.status, progress.completed, progress.total)}
          {progress.strength && (
            <span className="chip chip--iris">
              <Dumbbell size={12} strokeWidth={2.6} /> 근력
            </span>
          )}
        </div>
      </header>

      {plan.items.length === 0 ? (
        <p className="daydetail__empty">이 날은 계획된 영상이 없어요.</p>
      ) : (
        <ul className="dlist">
          {plan.items.map((item) => {
            const done = Boolean(record?.done[item.id]);
            const row = (
              <>
                <CheckMark checked={done} size={24} />
                <span className="dlist__text">
                  <span className="dlist__title">{item.title}</span>
                  <span className="dlist__meta">
                    {item.type === 'stretch' ? '스트레칭' : '운동'} · {itemCategory(item)}
                    {item.durationMin ? ` · ${item.durationMin}분` : ''}
                  </span>
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {editing ? (
                  <button
                    type="button"
                    className="dlist__row is-interactive"
                    onClick={() => setItemDone(dateKey, item.id, !done)}
                    aria-pressed={done}
                    aria-label={`${item.title}: ${done ? '완료' : '미완료'}. 탭해서 변경`}
                  >
                    {row}
                  </button>
                ) : (
                  <div className={`dlist__row${done ? ' is-done' : ''}`}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="daydetail__strength">
          <span className="daydetail__strength-label">
            <Dumbbell size={16} strokeWidth={2.4} /> 근력 운동
          </span>
          <Toggle
            checked={record?.strength === true}
            onChange={(v) => setStrength(dateKey, v ? true : false)}
            label="이 날 근력 운동 여부"
          />
        </div>
      )}

      {finishedAt && !editing && (
        <p className="daydetail__finished">
          {finishedAt.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}에 모두 완료
        </p>
      )}

      <footer className="daydetail__actions">
        <button type="button" className="text-link" onClick={() => onEditRoutine(dateKey)}>
          <ListVideo size={16} strokeWidth={2.3} /> 루틴 편집
        </button>
        {!isFuture && plan.items.length > 0 && (
          <button
            type="button"
            className={`pill-btn${editing ? ' is-active' : ''}`}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? (
              <>
                <Check size={15} strokeWidth={3} /> 완료
              </>
            ) : (
              <>
                <Pencil size={14} strokeWidth={2.5} /> 기록 수정
              </>
            )}
          </button>
        )}
      </footer>
    </section>
  );
}
