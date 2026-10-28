import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './Button';
import './month-header.css';

interface MonthHeaderProps {
  year: number;
  /** e.g. '10월' */
  month: string;
  /** Muted text after the month, e.g. '통계' */
  suffix?: ReactNode;
  /** Extra text next to the year, e.g. '이번 달' */
  note?: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
  /** Makes the centred title a button (e.g. to open the year view). */
  onTitleClick?: () => void;
  titleLabel?: string;
}

/** ‹   2026년 · 10월   › — centred month title with arrows at both edges. */
export function MonthHeader({
  year,
  month,
  suffix,
  note,
  onPrev,
  onNext,
  nextDisabled,
  prevDisabled,
  onTitleClick,
  titleLabel,
}: MonthHeaderProps) {
  const content = (
    <>
      <div className="overline num">
        {year}년{note ? ` · ${note}` : ''}
      </div>
      <h1 className="screen-title">
        {month}
        {suffix && <span className="screen-title__muted"> {suffix}</span>}
        {onTitleClick && <ChevronDown size={20} strokeWidth={2.6} className="month-header__caret" aria-hidden="true" />}
      </h1>
    </>
  );
  return (
    <header className="month-header">
      <IconButton label="이전 달" onClick={onPrev} disabled={prevDisabled}>
        <ChevronLeft size={20} strokeWidth={2.4} />
      </IconButton>
      {onTitleClick ? (
        <button type="button" className="month-header__title is-button" onClick={onTitleClick} aria-label={titleLabel}>
          {content}
        </button>
      ) : (
        <div className="month-header__title" aria-live="polite">
          {content}
        </div>
      )}
      <IconButton label="다음 달" onClick={onNext} disabled={nextDisabled}>
        <ChevronRight size={20} strokeWidth={2.4} />
      </IconButton>
    </header>
  );
}
