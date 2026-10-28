import { Clock3, Dumbbell, Moon } from 'lucide-react';
import { ProgressRing } from '../../components/ProgressRing';
import type { DayPlan, DayProgress } from '../../types';
import { durationSummary } from '../../lib/schedule';

interface TodayHeroProps {
  plan: DayPlan;
  progress: DayProgress;
  doneIds: Set<string>;
}

function headline(plan: DayPlan, p: DayProgress): string {
  if (p.total === 0) return '계획된 영상이 없어요';
  if (p.completed === p.total) return '오늘 운동 완료! 수고했어요';
  if (plan.isRest) return p.completed ? '가볍게 잘 풀었어요' : '오늘은 쉬어가는 날';
  if (p.completed === 0) return '오늘도 시작해 볼까요?';
  const left = p.total - p.completed;
  return `좋아요, ${left}개 남았어요`;
}

/** Dark progress card at the top of Today. */
export function TodayHero({ plan, progress, doneIds }: TodayHeroProps) {
  const duration = durationSummary(plan.items);
  const complete = progress.total > 0 && progress.completed === progress.total;
  return (
    <section className={`hero${complete ? ' is-complete' : ''}`} aria-label="오늘의 진행 상황">
      <div className="hero__text">
        <div className="hero__label">{plan.isRest ? '휴식일' : '오늘의 운동'}</div>
        <div className="hero__count num" aria-label={`${progress.total}개 중 ${progress.completed}개 완료`}>
          <span className="hero__count-big">{progress.completed}</span>
          <span className="hero__count-total">/ {progress.total}</span>
        </div>
        <div className="hero__headline">{headline(plan, progress)}</div>
        <div className="hero__meta">
          {duration.minutes > 0 && (
            <span>
              <Clock3 size={14} strokeWidth={2.4} aria-hidden="true" /> <span className="num">{duration.label}</span>
            </span>
          )}
          {plan.isRest ? (
            <span>
              <Moon size={14} strokeWidth={2.4} aria-hidden="true" /> 스트레칭만
            </span>
          ) : (
            progress.strength && (
              <span className="hero__strength">
                <Dumbbell size={14} strokeWidth={2.4} aria-hidden="true" /> 근력 운동
              </span>
            )
          )}
        </div>
      </div>

      <ProgressRing
        value={progress.ratio}
        size={92}
        stroke={10}
        track="rgba(255,255,255,0.09)"
        color="var(--accent-bright)"
        label={`${Math.round(progress.ratio * 100)}% 완료`}
      >
        <span className="hero__pct-wrap">
          <span className="hero__pct num">{Math.round(progress.ratio * 100)}</span>
          <span className="hero__pct-unit">%</span>
        </span>
      </ProgressRing>

      {plan.items.length > 0 && (
        <div className="hero__segments" aria-hidden="true">
          {plan.items.map((item) => (
            <span key={item.id} className={`hero__seg${doneIds.has(item.id) ? ' is-done' : ''}`} />
          ))}
        </div>
      )}
    </section>
  );
}
