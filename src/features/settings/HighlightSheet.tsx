import { Check, Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Toggle } from '../../components/Checkbox';
import { HighlightIcon } from '../../components/HighlightIcon';
import { RepeatDaysPicker } from '../../components/RepeatDaysPicker';
import { Sheet } from '../../components/Sheet';
import { parseDateKey, weekdaysLabel } from '../../lib/date';
import {
  HIGHLIGHT_ICONS,
  HIGHLIGHT_MODE_LABEL,
  highlightDayLabel,
  highlightQuestion,
  MAX_HIGHLIGHT_NAME,
  type HighlightIconKey,
  type HighlightMode,
  type HighlightSettings,
} from '../../lib/highlight';
import { EVERY_DAY, newItemId } from '../../lib/schedule';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';

const MODE_DETAIL: Record<HighlightMode, string> = {
  ask: '운동을 마치면 물어보고, 오늘 화면 버튼으로도 체크해요', // shown with the actual question
  todo: '반복 할 일을 끝낸 날이 자동으로 파란색이 돼요',
  off: '캘린더와 통계에 한 가지 색만 써요',
};

/** 설정 › 파란색 기록: rename the second calendar colour and choose how it's recorded. */
export function HighlightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { highlight, setHighlight, recurring, records, todayKey, saveRecurring } = useStore();
  const toast = useToast();
  const [name, setName] = useState(highlight.name);
  const [icon, setIcon] = useState<HighlightIconKey>(highlight.icon);
  const [mode, setMode] = useState<HighlightMode>(highlight.mode);
  const [askAfter, setAskAfter] = useState(highlight.askAfterWorkout !== false);
  const [link, setLink] = useState<string>('new');
  const [days, setDays] = useState<number[]>([...EVERY_DAY]);
  const [specific, setSpecific] = useState(false);
  const [error, setError] = useState(false);

  const todoRules = recurring.filter((r) => r.type === 'todo' && (!r.endDate || r.endDate >= todayKey));

  useEffect(() => {
    if (!open) return;
    setName(highlight.name);
    setIcon(highlight.icon);
    setMode(highlight.mode);
    setAskAfter(highlight.askAfterWorkout !== false);
    setLink(highlight.mode === 'todo' && highlight.ruleId ? highlight.ruleId : 'new');
    setDays([...EVERY_DAY]);
    setSpecific(false);
    setError(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = name.trim() || highlight.name;
  const pastAnswers = Object.values(records).filter((r) => r.strength === true).length;
  const renamed = name.trim() && name.trim() !== highlight.name;

  const save = () => {
    const n = name.trim().slice(0, MAX_HIGHLIGHT_NAME);
    if (!n || (mode === 'todo' && link === 'new' && days.length === 0)) {
      setError(true);
      return;
    }
    let ruleId: string | undefined;
    if (mode === 'todo') {
      if (link === 'new') {
        ruleId = newItemId().replace('custom-', '');
        saveRecurring({
          id: ruleId,
          type: 'todo',
          title: n,
          youtubeUrl: '',
          weekdays: days,
          startDate: todayKey,
          createdAt: new Date().toISOString(),
        });
      } else ruleId = link;
    }
    // a to-do that stops being the link keeps counting for the days it was checked
    const past = new Set(highlight.pastRuleIds ?? []);
    if (highlight.ruleId && highlight.ruleId !== ruleId) past.add(highlight.ruleId);
    if (ruleId) past.delete(ruleId);
    const next: HighlightSettings = {
      mode,
      name: n,
      icon,
      ruleId,
      pastRuleIds: past.size ? [...past] : undefined,
      askAfterWorkout: askAfter,
    };
    setHighlight(next);
    toast({ message: mode === 'off' ? '파란색 기록을 껐어요' : `파란색 기록: ${n} · ${HIGHLIGHT_MODE_LABEL[mode]}` });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      eyebrow="캘린더 · 통계"
      title="파란색 기록"
      footer={
        <div className="editor-footer">
          <Button variant="dark" size="lg" block onClick={save}>
            저장
          </Button>
        </div>
      }
    >
      <div className="hl-form">
        <p className="hl-form__lead">캘린더에 파란색으로 따로 표시할 습관을 정해요. 기본은 '근력 운동'이에요.</p>

        <div className={`hl-preview${mode === 'off' ? ' is-off' : ''}`} aria-hidden="true">
          <span className="hl-preview__cells">
            <i />
            <i className="is-hl" />
            <i />
            <i className="is-hl" />
          </span>
          <span className="hl-preview__chip">
            <HighlightIcon icon={icon} size={14} /> {mode === 'off' ? '사용 안 함' : highlightDayLabel(label)}
          </span>
        </div>

        <section className="hl-section">
          <h3 className="hl-section__title">이름과 아이콘</h3>
          <input
            className={`input${error && !name.trim() ? ' is-invalid' : ''}`}
            value={name}
            maxLength={MAX_HIGHLIGHT_NAME}
            placeholder="예: 명상, 만보 걷기, 독서"
            onChange={(e) => setName(e.target.value)}
            aria-label="파란색 기록 이름"
          />
          <div className="hl-icons" role="radiogroup" aria-label="아이콘">
            {HIGHLIGHT_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                className={`hl-icon${icon === key ? ' is-on' : ''}`}
                onClick={() => setIcon(key)}
              >
                <HighlightIcon icon={key} size={20} strokeWidth={2.2} />
              </button>
            ))}
          </div>
          {renamed && pastAnswers > 0 && (
            <p className="hl-warn">
              예전 '{highlight.name}' 기록 {pastAnswers}일도 '{name.trim()}' 기록으로 보여요.
            </p>
          )}
        </section>

        <section className="hl-section">
          <h3 className="hl-section__title">기록 방법</h3>
          <div className="hl-modes" role="radiogroup" aria-label="기록 방법">
            {(['ask', 'todo', 'off'] as HighlightMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={`hl-mode${mode === m ? ' is-on' : ''}`}
                onClick={() => setMode(m)}
              >
                <span className="hl-mode__radio" aria-hidden="true">
                  {mode === m && <Check size={13} strokeWidth={3.4} />}
                </span>
                <span className="hl-mode__text">
                  <strong>{HIGHLIGHT_MODE_LABEL[m]}</strong>
                  <small>{m === 'ask' ? '오늘 화면의 버튼을 눌러 켜고 꺼요' : MODE_DETAIL[m]}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        {mode === 'ask' && (
          <div className="hl-ask">
            <span className="hl-ask__text">
              <strong>운동 마치면 물어보기</strong>
              <small>{askAfter ? `완료 화면에서 "${highlightQuestion(label)}"라고 물어요` : '묻지 않아요. 오늘 화면 버튼으로만 기록해요'}</small>
            </span>
            <Toggle checked={askAfter} onChange={setAskAfter} label="운동 마치면 물어보기" />
          </div>
        )}

        {mode === 'todo' && (
          <section className="hl-section">
            <h3 className="hl-section__title">연결할 할 일</h3>
            <div className="hl-modes" role="radiogroup" aria-label="연결할 할 일">
              <button
                type="button"
                role="radio"
                aria-checked={link === 'new'}
                className={`hl-mode${link === 'new' ? ' is-on' : ''}`}
                onClick={() => setLink('new')}
              >
                <span className="hl-mode__radio" aria-hidden="true">
                  {link === 'new' && <Check size={13} strokeWidth={3.4} />}
                </span>
                <span className="hl-mode__text">
                  <strong>새 반복 할 일 '{label}' 만들기</strong>
                  <small>오늘의 루틴에 매일(또는 고른 요일) 들어가요</small>
                </span>
              </button>
              {todoRules.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={link === r.id}
                  className={`hl-mode${link === r.id ? ' is-on' : ''}`}
                  onClick={() => setLink(r.id)}
                >
                  <span className="hl-mode__radio" aria-hidden="true">
                    {link === r.id && <Check size={13} strokeWidth={3.4} />}
                  </span>
                  <span className="hl-mode__text">
                    <strong>{r.title}</strong>
                    <small>
                      <Repeat size={11} strokeWidth={2.6} /> {r.weekdays.length === 7 ? '매일' : weekdaysLabel(r.weekdays)}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            {link === 'new' && (
              <div className="todo-form__repeat hl-days">
                <RepeatDaysPicker
                  days={days}
                  specific={specific}
                  defaultDay={parseDateKey(todayKey).getDay()}
                  onChange={(d, s) => {
                    setDays(d);
                    setSpecific(s);
                  }}
                />
                {error && days.length === 0 && <p className="field__hint is-error">요일을 하나 이상 골라 주세요</p>}
              </div>
            )}
          </section>
        )}

        <p className="settings__foot">이 기기에만 적용돼요. 친구가 바꿔도 다른 사람의 앱은 그대로예요.</p>
      </div>
    </Sheet>
  );
}
