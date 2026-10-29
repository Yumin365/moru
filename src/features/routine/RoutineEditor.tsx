import { ArrowDown, ArrowUp, Plus, Repeat, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { Toggle } from '../../components/Checkbox';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RepeatDaysPicker } from '../../components/RepeatDaysPicker';
import { Sheet } from '../../components/Sheet';
import { addDays, formatParts, parseDateKey, WEEKDAYS_SHORT, weekdaysLabel } from '../../lib/date';
import { EVERY_DAY, isVideo, mergeStretchDefaults, newItemId, ruleApplies, stretchDaysOn, type StretchSlot } from '../../lib/schedule';
import { parseYouTubeId } from '../../lib/youtube';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import type { RecurringRule, RoutineItem, WorkoutType } from '../../types';
import { VideoFields } from './VideoFields';
import './routine.css';

interface RoutineEditorProps {
  dateKey: string | null;
  onClose: () => void;
}

/** A draft row. `repeatDays` set = repeats every week on those weekdays (all 7 = every day). */
type DraftItem = RoutineItem & {
  repeatDays?: number[];
  /** "특정 요일만" picker open */
  specific?: boolean;
  /** the default daily stretch of this slot */
  dailyStretch?: StretchSlot;
  /** existing weekly rule this row represents */
  ruleRef?: string;
};

const sameFields = (a: RoutineItem, b: RoutineItem) =>
  a.type === b.type &&
  a.title === b.title &&
  a.youtubeUrl === b.youtubeUrl &&
  (a.durationMin ?? null) === (b.durationMin ?? null) &&
  (a.category ?? null) === (b.category ?? null);

const repeatSummary = (days: number[]) => (days.length === 7 ? '매일 반복' : `매주 ${weekdaysLabel(days)} 반복`);

/**
 * Edit one day's videos: paste links, rename, reorder, add, remove — and make any
 * video repeat (every day by default, or only on chosen weekdays).
 */
export function RoutineEditor({ dateKey, onClose }: RoutineEditorProps) {
  const {
    getPlan,
    saveRoutine,
    resetRoutine,
    todayKey,
    recurring,
    saveRecurring,
    stopRecurring,
    stretchOverrides,
    setStretchOverride,
    stretchDays,
    setStretchDays,
    setDayOrder,
  } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const fullPlan = dateKey ? getPlan(dateKey) : null;
  const plan = fullPlan ? { ...fullPlan, items: fullPlan.items.filter(isVideo) } : null;
  const weekday = dateKey ? parseDateKey(dateKey).getDay() : 0;
  const ruleById = (id?: string) => recurring.find((r) => r.id === id);
  const defaults = mergeStretchDefaults(stretchOverrides);
  const baseIds = new Set((plan?.items ?? []).filter((i) => !i.recurringId).map((i) => i.id));

  useEffect(() => {
    if (!dateKey) return;
    const items = getPlan(dateKey).items.filter(isVideo);
    setDraft(
      items.map((i) => {
        const video = parseYouTubeId(i.youtubeUrl);
        // default daily stretch?
        const slot = i.id === 'stretch1' || i.id === 'stretch2' ? i.id : undefined;
        const def = slot ? defaults[slot] : null;
        if (slot && def && parseYouTubeId(def.youtubeUrl) === video) {
          const days = stretchDaysOn(stretchDays, slot, dateKey);
          return { ...i, dailyStretch: slot, repeatDays: [...days], specific: days.length < 7 };
        }
        // a weekly rule (added by it, or the same video already in the day)
        const rule =
          ruleById(i.recurringId) ??
          recurring.find((r) => ruleApplies(r, dateKey) && parseYouTubeId(r.youtubeUrl) === video);
        if (rule) return { ...i, ruleRef: rule.id, repeatDays: [...rule.weekdays], specific: rule.weekdays.length < 7 };
        return { ...i };
      }),
    );
    setShowErrors(false);
    // reload the draft only when a (new) date is opened, not on every store change
  }, [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, patch: Partial<DraftItem>) =>
    setDraft((d) => d.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) =>
    setDraft((d) => {
      const target = index + delta;
      if (target < 0 || target >= d.length) return d;
      const copy = [...d];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const add = (type: WorkoutType) => setDraft((d) => [...d, { id: newItemId(), type, title: '', youtubeUrl: '' }]);

  /** Repeat on → every day by default. */
  const toggleRepeat = (item: DraftItem, on: boolean) =>
    update(item.id, { repeatDays: on ? [...EVERY_DAY] : undefined, specific: false });



  const invalid = draft.filter((i) => !parseYouTubeId(i.youtubeUrl));
  const noDays = draft.filter((i) => i.repeatDays && i.repeatDays.length === 0);

  /** Rule-only rows get placed automatically (before the cool-down stretch). */
  const autoPlaced = (item: DraftItem) =>
    item.repeatDays !== undefined && !item.dailyStretch && (Boolean(item.recurringId) || !baseIds.has(item.id));

  const save = () => {
    if (!dateKey || !plan) return;
    if (invalid.length || noDays.length) {
      setShowErrors(true);
      return;
    }
    let w = 0;
    let s = 0;
    const cleaned = draft.map((item) => {
      const n = item.type === 'stretch' ? ++s : ++w;
      return {
        ...item,
        title: item.title.trim() || `${item.type === 'stretch' ? '스트레칭' : '운동'} ${n}`,
        youtubeUrl: item.youtubeUrl.trim(),
        category: item.category?.trim() || undefined,
      };
    });
    const original = new Map(plan.items.map((i) => [i.id, i]));

    // 1) default daily stretches: weekdays + video apply to every day from here on
    for (const item of cleaned) {
      const slot = item.dailyStretch;
      if (!slot) continue;
      const current = stretchDaysOn(stretchDays, slot, dateKey);
      if (!item.repeatDays) setStretchDays(slot, addDays(dateKey, 1), []); // keep it today, stop after
      else if (item.repeatDays.join() !== current.join()) setStretchDays(slot, dateKey, item.repeatDays);
      const before = original.get(item.id);
      if (before && !sameFields(item, before)) {
        setStretchOverride(slot, {
          title: item.title,
          youtubeUrl: item.youtubeUrl,
          category: item.category,
          durationMin: item.durationMin !== before.durationMin ? item.durationMin : defaults[slot]?.durationMin,
        });
      }
    }

    // 2) other repeats → weekly rules (skipped automatically on days that already have the video)
    const keptRules = new Set<string>();
    let newRules = 0;
    for (const item of cleaned) {
      if (!item.repeatDays?.length || item.dailyStretch) continue;
      const existing = ruleById(item.ruleRef);
      const rule: RecurringRule = {
        id: existing?.id ?? newItemId().replace('custom-', ''),
        type: item.type,
        title: item.title,
        youtubeUrl: item.youtubeUrl,
        durationMin: item.durationMin,
        category: item.category,
        weekdays: item.repeatDays,
        startDate: existing?.startDate ?? dateKey,
        endDate: existing?.endDate,
      };
      if (!existing) newRules++;
      keptRules.add(rule.id);
      saveRecurring(rule);
    }
    // repeats removed here (deleted or switched off) stop from this day on
    const startedWith = new Set(
      plan.items
        .map((i) => i.recurringId ?? recurring.find((r) => ruleApplies(r, dateKey) && parseYouTubeId(r.youtubeUrl) === parseYouTubeId(i.youtubeUrl))?.id)
        .filter((id): id is string => !!id),
    );
    for (const id of startedWith) if (!keptRules.has(id)) stopRecurring(id, dateKey);

    // 3) the day's own list; only saved when it actually changed
    const dayItems: RoutineItem[] = cleaned
      .filter((i) => !i.repeatDays || i.dailyStretch || (baseIds.has(i.id) && !i.recurringId))
      .map(({ repeatDays: _r, recurringId: _rid, specific: _s, dailyStretch: _d, ruleRef: _ref, ...rest }) => rest);
    const base = plan.items.filter((i) => !i.recurringId);
    const unchanged =
      dayItems.length === base.length &&
      dayItems.every((item, i) => {
        const b = base[i];
        if (item.id !== b.id) return false;
        // default stretch edits were applied globally above
        return cleaned.find((c) => c.id === item.id)?.dailyStretch ? true : sameFields(item, b);
      });
    if (!unchanged || plan.isCustom) saveRoutine(dateKey, dayItems);
    setDayOrder(cleaned.map((i) => i.id));

    toast({ message: newRules ? '루틴을 저장했어요 · 반복이 추가됐어요' : '루틴을 저장했어요' });
    onClose();
  };

  const parts = dateKey ? formatParts(dateKey) : null;
  const removing = draft.find((i) => i.id === removeId);
  const removingRule = removing?.ruleRef ? ruleById(removing.ruleRef) : undefined;

  return (
    <>
      <Sheet
        open={dateKey !== null}
        onClose={onClose}
        tall
        eyebrow={parts ? `${dateKey === todayKey ? '오늘 · ' : ''}${parts.label} (${parts.weekdayShort})` : ''}
        title="루틴 편집"
        footer={
          <div className="editor-footer">
            {plan?.isCustom && (
              <Button variant="ghost" icon={<RotateCcw size={16} strokeWidth={2.4} />} onClick={() => setConfirmReset(true)}>
                초기화
              </Button>
            )}
            <Button variant="dark" size="lg" className="editor-footer__save" onClick={save}>
              루틴 저장
            </Button>
          </div>
        }
      >
        <p className="editor-intro">
          위에서부터 순서대로 재생돼요. 유튜브 링크를 붙여넣으면 이 날에만 적용되고, <b>매주 반복</b>을 켜면 매일(또는 고른
          요일마다) 자동으로 들어가요. 그날 이미 같은 영상이 있으면 중복으로 넣지 않아요.
          {plan?.isCustom ? ' 이 날은 수정된 루틴이에요. 초기화하면 원래 일정으로 돌아가요.' : ''}
        </p>

        {showErrors && (invalid.length > 0 || noDays.length > 0) && (
          <div className="editor-alert" role="alert">
            {invalid.length > 0 && <div>영상 {invalid.length}개에 올바른 유튜브 링크가 필요해요.</div>}
            {noDays.length > 0 && <div>반복할 요일을 하나 이상 골라주세요.</div>}
          </div>
        )}

        <ol className="editor-list">
          {draft.map((item, index) => {
            const repeating = item.repeatDays !== undefined;
            const rule = ruleById(item.ruleRef);
            const fixed = autoPlaced(item);
            const days = item.repeatDays ?? [];
            return (
              <li key={item.id} className={`editor-item editor-item--${item.type}${repeating ? ' is-repeat' : ''}`}>
                <div className="editor-item__head">
                  <span className="editor-item__num num">{String(index + 1).padStart(2, '0')}</span>
                  <div className="seg" role="radiogroup" aria-label="종류">
                    {(['workout', 'stretch'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={item.type === t}
                        className={`seg__opt${item.type === t ? ' is-on' : ''}`}
                        onClick={() => update(item.id, { type: t })}
                      >
                        {t === 'workout' ? '운동' : '스트레칭'}
                      </button>
                    ))}
                  </div>
                  <div className="editor-item__tools">
                    <IconButton label="위로 이동" variant="plain" size={40} disabled={index === 0 || fixed} onClick={() => move(index, -1)}>
                      <ArrowUp size={18} strokeWidth={2.4} />
                    </IconButton>
                    <IconButton
                      label="아래로 이동"
                      variant="plain"
                      size={40}
                      disabled={index === draft.length - 1 || fixed}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={18} strokeWidth={2.4} />
                    </IconButton>
                    <IconButton label="영상 삭제" variant="plain" size={40} onClick={() => setRemoveId(item.id)}>
                      <Trash2 size={17} strokeWidth={2.3} />
                    </IconButton>
                  </div>
                </div>

                <VideoFields value={item} type={item.type} showErrors={showErrors} onChange={(patch) => update(item.id, patch)} />

                <div className="repeat">
                  <div className="repeat__row">
                    <span className="repeat__label">
                      <Repeat size={16} strokeWidth={2.4} /> 매주 반복
                    </span>
                    <Toggle checked={repeating} onChange={(on) => toggleRepeat(item, on)} label="매주 반복" />
                  </div>

                  {repeating && (
                    <>
                      <p className="repeat__hint">
                        {days.length ? repeatSummary(days) : '요일을 골라주세요'}
                        {item.dailyStretch
                          ? ' · 기본 스트레칭이라 바꾸면 반복되는 모든 날에 적용돼요'
                          : ` · ${formatParts(rule?.startDate ?? dateKey ?? todayKey).label}부터${fixed ? ' · 마무리 스트레칭 앞에 들어가요' : ''}`}
                        {days.length > 0 && !days.includes(weekday) ? ` · 이 날(${WEEKDAYS_SHORT[weekday]})은 빠져요` : ''}
                      </p>

                      <RepeatDaysPicker
                        days={days}
                        specific={Boolean(item.specific)}
                        defaultDay={weekday}
                        onChange={(d, sp) => update(item.id, { repeatDays: d, specific: sp })}
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {draft.length === 0 && <p className="editor-empty">아직 영상이 없어요. 아래에서 운동이나 스트레칭을 추가하세요.</p>}

        <div className="editor-add">
          <Button variant="outline" icon={<Plus size={17} strokeWidth={2.6} />} onClick={() => add('workout')}>
            운동 추가
          </Button>
          <Button variant="outline" icon={<Plus size={17} strokeWidth={2.6} />} onClick={() => add('stretch')}>
            스트레칭 추가
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={removeId !== null}
        icon={<Trash2 size={22} strokeWidth={2.2} />}
        destructive
        title={removingRule ? '반복을 멈출까요?' : '이 영상을 삭제할까요?'}
        message={
          removingRule
            ? `‘${removing?.title}’이(가) 저장하면 이 날부터 더 이상 반복되지 않아요. 지난 날짜 기록은 그대로예요.`
            : removing?.dailyStretch
              ? `‘${removing.title}’이(가) 이 날에만 빠져요. 다른 날에는 계속 들어가요.`
              : removing?.title
                ? `‘${removing.title}’이(가) 이 날 루틴에서 빠져요.`
                : undefined
        }
        confirmLabel={removingRule ? '반복 멈추기' : '삭제'}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          setDraft((d) => d.filter((i) => i.id !== removeId));
          setRemoveId(null);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        icon={<RotateCcw size={22} strokeWidth={2.2} />}
        title="원래 일정으로 되돌릴까요?"
        message="이 날 수정한 내용이 삭제되고 운동 일정의 루틴이 다시 사용돼요. 반복 영상은 그대로예요."
        confirmLabel="되돌리기"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          if (dateKey) resetRoutine(dateKey);
          setConfirmReset(false);
          toast({ message: '원래 일정으로 되돌렸어요' });
          onClose();
        }}
      />
    </>
  );
}
