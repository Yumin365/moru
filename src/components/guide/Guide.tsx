import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button';
import './guide.css';

export interface GuideStep {
  /** small chip above the title, e.g. "처음 한 번만" / "매달" */
  tag?: string;
  title: string;
  body: ReactNode;
  /** the screen illustration */
  art: ReactNode;
  /** optional real button for this step (e.g. "북마크 코드 복사") */
  action?: ReactNode;
}

interface GuideProps {
  steps: GuideStep[];
  /** reset to step 1 when this changes (e.g. when the sheet opens) */
  resetKey?: unknown;
  onFinish?: () => void;
  finishLabel?: string;
}

/** One-step-per-screen visual guide with dots, 이전/다음 and swipe. */
export function Guide({ steps, resetKey, onFinish, finishLabel = '완료' }: GuideProps) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => setIndex(0), [resetKey, steps.length]);

  const go = (i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i)));

  return (
    <div
      className="guide"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="guide__top">
        <span className="guide__count num">
          {index + 1} / {steps.length}
        </span>
        <div className="guide__dots" role="tablist" aria-label="단계">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}단계: ${s.title}`}
              className={`guide__dot${i === index ? ' is-on' : ''}${i < index ? ' is-done' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>

      <div className="guide__stage" key={index}>
        <div className="guide__art" aria-hidden="true">
          {step.art}
        </div>
        <div className="guide__text">
          {step.tag && <span className="guide__tag">{step.tag}</span>}
          <h3 className="guide__title">
            <span className="guide__num num">{index + 1}</span>
            {step.title}
          </h3>
          <div className="guide__body">{step.body}</div>
          {step.action && <div className="guide__action">{step.action}</div>}
        </div>
      </div>

      <div className="guide__nav">
        <Button variant="soft" onClick={() => go(index - 1)} disabled={index === 0} icon={<ChevronLeft size={18} strokeWidth={2.4} />}>
          이전
        </Button>
        {last ? (
          onFinish && (
            <Button variant="dark" onClick={onFinish}>
              {finishLabel}
            </Button>
          )
        ) : (
          <Button variant="dark" onClick={() => go(index + 1)} trailingIcon={<ChevronRight size={18} strokeWidth={2.4} />}>
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
