import { Repeat, RotateCcw, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RepeatDaysPicker } from '../../components/RepeatDaysPicker';
import { Sheet } from '../../components/Sheet';
import { parseDateKey, weekdaysLabel } from '../../lib/date';
import { EVERY_DAY, mergeStretchDefaults, newItemId, stretchDaysOn, type StretchSlot } from '../../lib/schedule';
import { parseYouTubeId } from '../../lib/youtube';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import type { WorkoutType } from '../../types';
import { VideoFields, type VideoDraft } from '../routine/VideoFields';
import '../routine/routine.css';

export type RepeatTarget = { kind: 'stretch'; slot: StretchSlot } | { kind: 'rule'; id: string } | { kind: 'new' };

interface RepeatEditorProps {
  target: RepeatTarget | null;
  onClose: () => void;
}

const SLOT_LABEL: Record<StretchSlot, string> = { stretch1: '기본 스트레칭 1 · 시작', stretch2: '기본 스트레칭 2 · 마무리' };
const EMPTY: VideoDraft = { title: '', youtubeUrl: '' };

/** Edit one repeating video (a default stretch or a weekly rule), or add a new one. Changes apply from today on. */
export function RepeatEditor({ target, onClose }: RepeatEditorProps) {
  const {
    todayKey,
    recurring,
    saveRecurring,
    stopRecurring,
    stretchOverrides,
    setStretchOverride,
    stretchDays,
    setStretchDays,
  } = useStore();
  const toast = useToast();
  const [video, setVideo] = useState<VideoDraft>(EMPTY);
  const [type, setType] = useState<WorkoutType>('workout');
  const [days, setDays] = useState<number[]>([...EVERY_DAY]);
  const [specific, setSpecific] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const weekday = parseDateKey(todayKey).getDay();
  const defaults = mergeStretchDefaults(stretchOverrides);
  const rule = target?.kind === 'rule' ? recurring.find((r) => r.id === target.id) : undefined;

  useEffect(() => {
    if (!target) return;
    setShowErrors(false);
    if (target.kind === 'stretch') {
      const ref = defaults[target.slot];
      const d = ref ? stretchDaysOn(stretchDays, target.slot, todayKey) : [...EVERY_DAY];
      setVideo(ref ? { ...ref } : EMPTY);
      setType('stretch');
      setDays(d.length ? d : [...EVERY_DAY]);
      setSpecific(d.length > 0 && d.length < 7);
    } else if (target.kind === 'rule' && rule) {
      setVideo({ title: rule.title, youtubeUrl: rule.youtubeUrl, durationMin: rule.durationMin, category: rule.category });
      setType(rule.type);
      setDays(rule.weekdays);
      setSpecific(rule.weekdays.length < 7);
    } else {
      setVideo(EMPTY);
      setType('workout');
      setDays([...EVERY_DAY]);
      setSpecific(false);
    }
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!target) return;
    if (!parseYouTubeId(video.youtubeUrl) || days.length === 0) {
      setShowErrors(true);
      return;
    }
    const ref = {
      title: video.title.trim() || (type === 'stretch' ? '스트레칭' : '운동'),
      youtubeUrl: video.youtubeUrl.trim(),
      durationMin: video.durationMin,
      category: video.category?.trim() || undefined,
    };
    if (target.kind === 'stretch') {
      const before = defaults[target.slot];
      if (!before || before.youtubeUrl !== ref.youtubeUrl || before.title !== ref.title || before.category !== ref.category || before.durationMin !== ref.durationMin)
        setStretchOverride(target.slot, ref);
      if (stretchDaysOn(stretchDays, target.slot, todayKey).join() !== days.join() || !before)
        setStretchDays(target.slot, todayKey, days);
    } else {
      saveRecurring({
        id: rule?.id ?? newItemId().replace('custom-', ''),
        type,
        ...ref,
        weekdays: days,
        startDate: rule?.startDate ?? todayKey,
        endDate: rule?.endDate,
      });
    }
    toast({ message: target.kind === 'new' ? '반복 영상을 추가했어요' : '반복 루틴을 저장했어요' });
    onClose();
  };

  const eyebrow =
    target?.kind === 'stretch' ? SLOT_LABEL[target.slot] : target?.kind === 'new' ? '오늘부터 적용' : '반복 영상';
  const summary = days.length ? (days.length === 7 ? '매일 반복' : `매주 ${weekdaysLabel(days)} 반복`) : '요일을 골라주세요';

  return (
    <>
      <Sheet
        open={target !== null}
        onClose={onClose}
        tall
        eyebrow={eyebrow}
        title={target?.kind === 'new' ? '반복 영상 추가' : '반복 루틴 편집'}
        footer={
          <Button variant="dark" size="lg" block onClick={save}>
            {target?.kind === 'new' ? '반복 영상 추가' : '저장'}
          </Button>
        }
      >
        <p className="editor-intro">
          {target?.kind === 'stretch'
            ? '매일 루틴의 처음/끝에 들어가는 스트레칭이에요. 바꾸면 오늘부터 반복되는 모든 날에 적용돼요.'
            : '고른 요일마다 마무리 스트레칭 앞에 자동으로 들어가요. 그날 이미 같은 영상이 있으면 넣지 않아요.'}
        </p>

        {showErrors && (
          <div className="editor-alert" role="alert">
            {!parseYouTubeId(video.youtubeUrl) && <div>올바른 유튜브 링크가 필요해요.</div>}
            {days.length === 0 && <div>반복할 요일을 하나 이상 골라주세요.</div>}
          </div>
        )}

        <div className="editor-item is-repeat">
          {target?.kind !== 'stretch' && (
            <div className="editor-item__head">
              <div className="seg" role="radiogroup" aria-label="종류">
                {(['workout', 'stretch'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    className={`seg__opt${type === t ? ' is-on' : ''}`}
                    onClick={() => setType(t)}
                  >
                    {t === 'workout' ? '운동' : '스트레칭'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <VideoFields value={video} type={type} showErrors={showErrors} onChange={(p) => setVideo((v) => ({ ...v, ...p }))} />
          <div className="repeat">
            <div className="repeat__row">
              <span className="repeat__label">
                <Repeat size={16} strokeWidth={2.4} /> {summary}
              </span>
            </div>
            <RepeatDaysPicker
              days={days}
              specific={specific}
              defaultDay={weekday}
              onChange={(d, s) => {
                setDays(d);
                setSpecific(s);
              }}
            />
          </div>
        </div>

        {target?.kind === 'stretch' && (
          <div className="editor-add">
            <Button
              variant="soft"
              icon={<RotateCcw size={16} strokeWidth={2.4} />}
              onClick={() => {
                setStretchOverride(target.slot, undefined);
                setStretchDays(target.slot, todayKey, [...EVERY_DAY]);
                toast({ message: '앱 기본 스트레칭으로 되돌렸어요' });
                onClose();
              }}
            >
              앱 기본값으로
            </Button>
            <Button
              variant="soft"
              icon={<Square size={15} strokeWidth={2.4} />}
              onClick={() => {
                setStretchDays(target.slot, todayKey, []);
                toast({ message: '오늘부터 이 스트레칭을 빼요' });
                onClose();
              }}
            >
              사용 안 함
            </Button>
          </div>
        )}

        {target?.kind === 'rule' && (
          <div className="editor-add editor-add--single">
            <Button variant="outline" onClick={() => setConfirmStop(true)}>
              반복 멈추기
            </Button>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmStop}
        destructive
        icon={<Repeat size={22} strokeWidth={2.2} />}
        title="반복을 멈출까요?"
        message={rule ? `‘${rule.title}’이(가) 오늘부터 더 이상 들어가지 않아요. 지난 날짜 기록은 그대로예요.` : undefined}
        confirmLabel="반복 멈추기"
        onCancel={() => setConfirmStop(false)}
        onConfirm={() => {
          if (rule) stopRecurring(rule.id, todayKey);
          setConfirmStop(false);
          toast({ message: '반복을 멈췄어요' });
          onClose();
        }}
      />
    </>
  );
}
