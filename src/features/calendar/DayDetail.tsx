import { Check, ListVideo, Moon, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CheckMark, Toggle } from '../../components/Checkbox';
import { HighlightIcon } from '../../components/HighlightIcon';
import { formatParts } from '../../lib/date';
import { itemCategory, TYPE_LABEL } from '../../lib/schedule';
import { useStore } from '../../state/WorkoutStore';
import { useHighlight } from '../../state/useHighlight';

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
  const hl = useHighlight();
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
              <HighlightIcon icon={hl.icon} size={12} strokeWidth={2.6} /> {hl.name}
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
                    {TYPE_LABEL[item.type]}
                    {itemCategory(item) ? ` · ${itemCategory(item)}` : ''}
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

      {editing && hl.mode === 'ask' && (
        <div className="daydetail__strength">
          <span className="daydetail__strength-label">
            <HighlightIcon icon={hl.icon} size={16} /> {hl.name}
          </span>
          <Toggle
            checked={record?.strength === true}
            onChange={(v) => setStrength(dateKey, v ? true : false)}
            label={`이 날 ${hl.name} 여부`}
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
