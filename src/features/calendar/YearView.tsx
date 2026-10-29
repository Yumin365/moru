import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../components/Button';
import { monthGrid, monthKey } from '../../lib/date';
import { useBackButton } from '../../state/useBackButton';
import { useStore } from '../../state/WorkoutStore';
import type { DayProgress } from '../../types';
import { intensity } from './CalendarDay';
import './year.css';
import { useHighlight } from '../../state/useHighlight';

interface YearViewProps {
  open: boolean;
  /** Month currently shown in the calendar ('YYYY-MM') */
  activeMonth: string;
  onClose: () => void;
  onSelectMonth: (month: string) => void;
}

function cellClass(p: DayProgress, isToday: boolean): string {
  const level = intensity(p);
  return [
    'ycell',
    `ycell--l${level}`,
    `is-${p.status}`,
    p.strength && level > 0 && 'is-strength',
    isToday && 'is-today',
  ]
    .filter(Boolean)
    .join(' ');
}

/** The whole year at a glance: 12 mini heat-map months (no day numbers). */
export function YearView({ open, activeMonth, onClose, onSelectMonth }: YearViewProps) {
  const hl = useHighlight();
  const { todayKey, getProgress, options, appStart, lastPlannedMonth } = useStore();
  const minMonth = monthKey(appStart);
  const minYear = Number(minMonth.slice(0, 4));
  const maxYear = Number(lastPlannedMonth.slice(0, 4));
  const [year, setYear] = useState(() => Number(activeMonth.slice(0, 4)));
  useBackButton(open, onClose);

  useEffect(() => {
    if (open) setYear(Number(activeMonth.slice(0, 4)));
  }, [open, activeMonth]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('is-locked');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`;
        const cells = monthGrid(key, options.weekStartsOn).flat();
        let workoutDays = 0;
        const days = cells.map((dateKey) => {
          if (!dateKey) return null;
          const p = getProgress(dateKey);
          if (p.completed > 0 && p.status !== 'future') workoutDays++;
          return { dateKey, p };
        });
        return { key, label: `${i + 1}월`, days, workoutDays };
      }),
    [year, getProgress, options.weekStartsOn],
  );

  const totals = useMemo(() => {
    let days = 0;
    let strength = 0;
    for (const m of months)
      for (const d of m.days) {
        if (!d || d.p.status === 'future') continue;
        if (d.p.completed > 0) days++;
        if (d.p.strength) strength++;
      }
    return { days, strength };
  }, [months]);

  if (!open) return null;

  const currentMonth = monthKey(todayKey);

  return createPortal(
    <div className="yearview" role="dialog" aria-modal="true" aria-label={`${year}년 연간 기록`}>
      <div className="yearview__inner">
        <div className="yearview__top">
          <IconButton label="닫기" onClick={onClose}>
            <X size={20} strokeWidth={2.4} />
          </IconButton>
        </div>

        <header className="month-header">
          <IconButton label="이전 해" onClick={() => setYear((y) => y - 1)} disabled={year <= minYear}>
            <ChevronLeft size={20} strokeWidth={2.4} />
          </IconButton>
          <div className="month-header__title">
            <div className="overline">연간 기록</div>
            <h1 className="screen-title num">{year}년</h1>
          </div>
          <IconButton label="다음 해" onClick={() => setYear((y) => y + 1)} disabled={year >= maxYear}>
            <ChevronRight size={20} strokeWidth={2.4} />
          </IconButton>
        </header>

        <div className="yearview__summary">
          <span>
            기록한 날 <strong className="num">{totals.days}</strong>일
          </span>
          <span>
            {hl.on && (
              <>
                {hl.name} <strong className="num">{totals.strength}</strong>일
              </>
            )}
          </span>
        </div>

        <div className="ygrid">
          {months.map((m) => {
            const off = m.key < minMonth || m.key > lastPlannedMonth;
            return (
            <button
              key={m.key}
              type="button"
              className={`ymonth${m.key === activeMonth ? ' is-active' : ''}${m.key === currentMonth ? ' is-current' : ''}${off ? ' is-off' : ''}`}
              disabled={off}
              onClick={() => onSelectMonth(m.key)}
              aria-label={`${year}년 ${m.label}: 기록한 날 ${m.workoutDays}일`}
            >
              <span className="ymonth__head">
                <span className="ymonth__label">{m.label}</span>
                {m.workoutDays > 0 && <span className="ymonth__count num">{m.workoutDays}</span>}
              </span>
              <span className="ymonth__cells" aria-hidden="true">
                {m.days.map((d, i) =>
                  d ? (
                    <span key={d.dateKey} className={d.dateKey < appStart ? 'ycell ycell--pad' : cellClass(d.p, d.dateKey === todayKey)} />
                  ) : (
                    <span key={`pad-${i}`} className="ycell ycell--pad" />
                  ),
                )}
              </span>
            </button>
            );
          })}
        </div>

        <div className="legend yearview__legend" aria-label="범례">
          <span className="legend__item">
            <i className="legend__sw legend__sw--l0" /> 기록 없음
          </span>
          <span className="legend__item">
            <i className="legend__sw legend__sw--l3" /> 기록
          </span>
          {hl.on && (
            <span className="legend__item">
              <i className="legend__sw legend__sw--s3" /> {hl.name}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
