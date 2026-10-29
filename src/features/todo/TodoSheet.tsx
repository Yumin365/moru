import { Repeat, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Toggle } from '../../components/Checkbox';
import { RepeatDaysPicker } from '../../components/RepeatDaysPicker';
import { Sheet } from '../../components/Sheet';
import { addDays, formatParts, parseDateKey } from '../../lib/date';
import { EVERY_DAY, newItemId, recurringItemId } from '../../lib/schedule';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import type { RoutineItem } from '../../types';
import './todo.css';

export type TodoTarget = { dateKey: string; item?: RoutineItem } | null;

const MAX_LEN = 60;

/** Add or edit a to-do: just text, optionally repeating every day / on chosen weekdays. */
export function TodoSheet({ target, onClose }: { target: TodoTarget; onClose: () => void }) {
  const { todayKey, recurring, records, addTodo, renameTodo, removeTodo, saveRecurring, stopRecurring, setItemDone } = useStore();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [days, setDays] = useState<number[]>([...EVERY_DAY]);
  const [specific, setSpecific] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dateKey = target?.dateKey ?? todayKey;
  const item = target?.item;
  const rule = item?.recurringId ? recurring.find((r) => r.id === item.recurringId) : undefined;
  const weekday = parseDateKey(dateKey).getDay();

  useEffect(() => {
    if (!target) return;
    setTitle(item?.title ?? '');
    setRepeat(Boolean(rule));
    setDays(rule ? [...rule.weekdays] : [...EVERY_DAY]);
    setSpecific(rule ? rule.weekdays.length < 7 : false);
    setError(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    const text = title.trim().slice(0, MAX_LEN);
    if (!text || (repeat && days.length === 0)) {
      setError(true);
      return;
    }
    const wasDone = item ? Boolean(records[dateKey]?.done[item.id]) : false;

    if (repeat) {
      const id = rule?.id ?? newItemId().replace('custom-', '');
      saveRecurring({
        id,
        type: 'todo',
        title: text,
        youtubeUrl: '',
        weekdays: days,
        startDate: rule?.startDate ?? dateKey,
        endDate: rule?.endDate,
        createdAt: rule?.createdAt ?? new Date().toISOString(),
      });
      if (item?.todoId) {
        // a one-off that now repeats: keep today's check on the new item
        removeTodo(dateKey, item.todoId);
        if (wasDone) setItemDone(dateKey, recurringItemId(id), true);
      }
    } else if (rule) {
      // repeat switched off → keep it through this day only
      saveRecurring({ ...rule, title: text });
      stopRecurring(rule.id, addDays(dateKey, 1));
    } else if (item?.todoId) {
      renameTodo(dateKey, item.todoId, text);
    } else {
      addTodo(dateKey, text);
    }
    toast({ message: item ? '할 일을 고쳤어요' : repeat ? '반복 할 일을 추가했어요' : '할 일을 추가했어요' });
    onClose();
  };

  const remove = () => {
    if (!item) return;
    if (rule) stopRecurring(rule.id, dateKey); // gone from this day on; earlier days keep their checks
    else if (item.todoId) removeTodo(dateKey, item.todoId);
    toast({ message: rule ? '반복 할 일을 그만했어요' : '할 일을 지웠어요' });
    onClose();
  };

  const parts = formatParts(dateKey);

  return (
    <Sheet
      open={target !== null}
      onClose={onClose}
      eyebrow={`${dateKey === todayKey ? '오늘 · ' : ''}${parts.label} (${parts.weekdayShort})`}
      title={item ? '할 일 고치기' : '할 일 추가'}
      footer={
        <div className="editor-footer">
          {item && (
            <Button variant="ghost" icon={<Trash2 size={16} strokeWidth={2.4} />} onClick={remove}>
              {rule ? '반복 그만하기' : '지우기'}
            </Button>
          )}
          <Button variant="dark" size="lg" className="editor-footer__save" onClick={save}>
            {item ? '저장' : '추가'}
          </Button>
        </div>
      }
    >
      <form
        className="todo-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="field">
          <span className="field__label">할 일</span>
          <input
            ref={inputRef}
            className={`input${error && !title.trim() ? ' is-invalid' : ''}`}
            value={title}
            maxLength={MAX_LEN}
            placeholder="예: 물 2L 마시기, 비타민 먹기"
            onChange={(e) => setTitle(e.target.value)}
            enterKeyHint="done"
          />
        </label>

        <div className="todo-form__repeat">
          <div className="repeat__row">
            <span className="repeat__label">
              <Repeat size={16} strokeWidth={2.4} /> 반복
            </span>
            <Toggle checked={repeat} onChange={setRepeat} label="반복" />
          </div>
          {repeat && (
            <>
              <p className="repeat__hint">{specific ? '고른 요일마다 할 일에 들어가요' : '매일 할 일에 들어가요'}</p>
              <RepeatDaysPicker
                days={days}
                specific={specific}
                defaultDay={weekday}
                onChange={(d, s) => {
                  setDays(d);
                  setSpecific(s);
                }}
              />
              {error && days.length === 0 && <p className="field__hint is-error">요일을 하나 이상 골라 주세요</p>}
            </>
          )}
        </div>
        <p className="todo-form__note">
          {item ? '오늘 화면에서 길게 눌러 순서를 바꿀 수 있어요.' : '새 할 일은 루틴 맨 위에 들어가요. 길게 눌러 순서를 바꿀 수 있어요.'}
        </p>
      </form>
    </Sheet>
  );
}
