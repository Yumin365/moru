import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { CheckMark } from '../../components/Checkbox';
import { Sheet } from '../../components/Sheet';
import { Thumbnail } from '../../components/Thumbnail';
import { durationSummary, itemCategory } from '../../lib/schedule';
import type { RoutineItem } from '../../types';

interface StartSheetProps {
  open: boolean;
  items: RoutineItem[];
  doneIds: Set<string>;
  onClose: () => void;
  onStart: (items: RoutineItem[]) => void;
}

/** "Which videos today?" — everything is selected by default. */
export function StartSheet({ open, items, doneIds, onClose, onStart }: StartSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));

  // Reset to "all on" every time the sheet opens (or the routine itself changes) —
  // not on every parent re-render, which would wipe the user's choices.
  const idsKey = items.map((i) => i.id).join('|');
  useEffect(() => {
    if (open) setSelected(new Set(idsKey.split('|').filter(Boolean)));
  }, [open, idsKey]);

  const chosen = items.filter((i) => selected.has(i.id));
  const duration = durationSummary(chosen);
  const allOn = chosen.length === items.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="운동 시작"
      title="오늘 할 영상을 골라주세요"
      footer={
        <Button
          size="lg"
          block
          disabled={chosen.length === 0}
          onClick={() => onStart(chosen)}
          icon={<Play size={18} strokeWidth={0} fill="currentColor" />}
          data-autofocus
        >
          {chosen.length === 0
            ? '영상을 하나 이상 선택해 주세요'
            : `영상 ${chosen.length}개 시작하기${duration.label ? ` · ${duration.label}` : ''}`}
        </Button>
      }
    >
      <div className="pick-head">
        <span className="section-sub">
          {items.length}개 중 {chosen.length}개 선택
        </span>
        <button
          type="button"
          className="text-link"
          onClick={() => setSelected(allOn ? new Set() : new Set(items.map((i) => i.id)))}
        >
          {allOn ? '모두 해제' : '모두 선택'}
        </button>
      </div>
      <ul className="pick-list">
        {items.map((item, index) => {
          const on = selected.has(item.id);
          return (
            <li key={item.id}>
              <label className={`pick${on ? ' is-on' : ''}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(item.id)} />
                <span className="pick__index num">{String(index + 1).padStart(2, '0')}</span>
                <Thumbnail url={item.youtubeUrl} type={item.type} className="pick__thumb" />
                <span className="pick__text">
                  <span className="pick__title">{item.title}</span>
                  <span className="pick__meta">
                    {item.type === 'stretch' ? '스트레칭' : '운동'} · {itemCategory(item)}
                    {item.durationMin ? ` · ${item.durationMin}분` : ''}
                    {doneIds.has(item.id) && <span className="pick__done">완료</span>}
                  </span>
                </span>
                <CheckMark checked={on} size={28} shape="square" tone="dark" />
              </label>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
