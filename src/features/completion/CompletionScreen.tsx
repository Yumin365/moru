import { Check, Clock3, Flame, ListChecks } from 'lucide-react';
import { Button } from '../../components/Button';
import { Confetti } from '../../components/Confetti';
import { Stamp } from '../../components/Stamp';
import { HighlightIcon } from '../../components/HighlightIcon';
import { useStore } from '../../state/WorkoutStore';
import { useHighlight } from '../../state/useHighlight';
import type { RoutineItem } from '../../types';
import './completion.css';

interface CompletionScreenProps {
  dateKey: string;
  sessionItems: RoutineItem[];
  onDone: () => void;
}

export function CompletionScreen({ dateKey, sessionItems, onDone }: CompletionScreenProps) {
  const { getPlan, getProgress, records, streak, setStrength } = useStore();
  const hl = useHighlight();
  const progress = getProgress(dateKey);
  const record = records[dateKey];
  const strength = record?.strength;
  const allDone = progress.total > 0 && progress.completed === progress.total;
  const sessionDone = sessionItems.filter((i) => record?.done[i.id]).length;
  const remainingTodos = getPlan(dateKey).items.filter((i) => i.type === 'todo' && !record?.done[i.id]).length;

  return (
    <div className="complete" role="dialog" aria-modal="true" aria-labelledby="complete-title">
      {allDone && <Confetti />}
      <div className="complete__inner">
        {allDone ? (
          <div className="complete__stamp" aria-hidden="true">
            <Stamp size={136} seed={dateKey} play />
          </div>
        ) : (
          <div className="complete__badge" aria-hidden="true">
            <svg viewBox="0 0 52 52" className="complete__check">
              <path d="M15 27.5 L23 35 L38 18" />
            </svg>
          </div>
        )}

        <div className="overline complete__eyebrow">{allDone ? '오늘 운동 완료' : '세션 종료'}</div>
        <h1 id="complete-title" className="complete__title">
          {allDone ? '수고했어요!' : sessionDone > 0 ? '잘했어요!' : '다음에 또 만나요'}
        </h1>
        <p className="complete__sub">
          {allDone
            ? '오늘 계획을 모두 마쳤어요. 연속 기록이 이어지고 있어요.'
            : remainingTodos === progress.total - progress.completed
              ? `남은 할 일 ${remainingTodos}개는 오늘 화면에서 체크해요.`
              : `오늘 남은 항목 ${progress.total - progress.completed}개 — 언제든 이어서 할 수 있어요.`}
        </p>

        <div className="complete__stats">
          <div className="stat-tile">
            <ListChecks size={18} strokeWidth={2.4} className="stat-tile__icon" aria-hidden="true" />
            <div className="stat-tile__value num">
              {progress.completed}
              <span> / {progress.total}</span>
            </div>
            <div className="stat-tile__label">완료</div>
          </div>
          <div className="stat-tile">
            <Clock3 size={18} strokeWidth={2.4} className="stat-tile__icon" aria-hidden="true" />
            <div className="stat-tile__value num">
              {progress.minutes}
              <span>분</span>
            </div>
            <div className="stat-tile__label">운동 시간</div>
          </div>
          <div className="stat-tile stat-tile--streak">
            <Flame size={18} strokeWidth={2.4} className="stat-tile__icon" aria-hidden="true" />
            <div className="stat-tile__value num">
              {streak.current}
              <span>일</span>
            </div>
            <div className="stat-tile__label">연속 기록</div>
          </div>
        </div>

        {hl.mode === 'ask' && hl.askAfterWorkout !== false && (
        <section className="strength-q" aria-labelledby="strength-q-title">
          <div className="strength-q__head">
            <span className="strength-q__icon" aria-hidden="true">
              <HighlightIcon icon={hl.icon} size={18} />
            </span>
            <div>
              <h2 id="strength-q-title" className="strength-q__title">
                {hl.question}
              </h2>
              <p className="strength-q__sub">{hl.dayLabel}은 캘린더에 다른 색으로 표시돼요.</p>
            </div>
          </div>
          <div className="strength-q__options" role="radiogroup" aria-labelledby="strength-q-title">
            <button
              type="button"
              role="radio"
              aria-checked={strength === true}
              className={`choice${strength === true ? ' is-yes' : ''}`}
              onClick={() => setStrength(dateKey, strength === true ? undefined : true)}
            >
              {strength === true && <Check size={16} strokeWidth={3} />} 네, 했어요
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={strength === false}
              className={`choice${strength === false ? ' is-no' : ''}`}
              onClick={() => setStrength(dateKey, strength === false ? undefined : false)}
            >
              {strength === false && <Check size={16} strokeWidth={3} />} 아니요
            </button>
          </div>
        </section>
        )}

        <Button variant="dark" size="lg" block onClick={onDone} className="complete__done" data-autofocus>
          확인
        </Button>
      </div>
    </div>
  );
}
