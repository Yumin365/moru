import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MonthHeader } from '../../components/MonthHeader';
import { Tip } from '../../components/Tip';
import { addMonths, formatMonthTitle, monthGrid, monthKey, weekdayLabels } from '../../lib/date';
import { monthStats } from '../../lib/stats';
import { useHighlight } from '../../state/useHighlight';
import { useStore } from '../../state/WorkoutStore';
import { CalendarDay } from './CalendarDay';
import { DayDetail } from './DayDetail';
import { YearView } from './YearView';
import './calendar.css';

interface CalendarViewProps {
  focusDate: string | null;
  onEditRoutine: (dateKey: string) => void;
}

export function CalendarView({ focusDate, onEditRoutine }: CalendarViewProps) {
  const hl = useHighlight();
  const { todayKey, getProgress, options, appStart, lastPlannedMonth } = useStore();
  const minMonth = monthKey(appStart);
  const maxMonth = lastPlannedMonth;
  const clamp = useCallback((m: string) => (m < minMonth ? minMonth : m > maxMonth ? maxMonth : m), [minMonth, maxMonth]);
  const [selected, setSelected] = useState(focusDate && focusDate >= appStart ? focusDate : todayKey);
  const [month, setMonthRaw] = useState(() => clamp(monthKey(focusDate ?? todayKey)));
  const setMonth = useCallback(
    (next: string | ((m: string) => string)) => setMonthRaw((m) => clamp(typeof next === 'function' ? next(m) : next)),
    [clamp],
  );
  const [yearOpen, setYearOpen] = useState(false);
  const closeYear = useCallback(() => setYearOpen(false), []);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusDate || focusDate < appStart) return;
    setSelected(focusDate);
    setMonth(monthKey(focusDate));
  }, [focusDate, appStart, setMonth]);

  const grid = useMemo(() => monthGrid(month, options.weekStartsOn), [month, options.weekStartsOn]);
  const stats = useMemo(() => monthStats(month, getProgress, todayKey, appStart), [month, getProgress, todayKey, appStart]);
  const title = formatMonthTitle(month);
  const isCurrentMonth = month === monthKey(todayKey);

  // Horizontal swipe on the grid changes month.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) setMonth((m) => addMonths(m, dx < 0 ? 1 : -1));
  };

  return (
    <div className="calendar screen">
      <MonthHeader
        year={title.year}
        month={title.month}
        onPrev={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, 1))}
        prevDisabled={month <= minMonth}
        nextDisabled={month >= maxMonth}
        onTitleClick={() => setYearOpen(true)}
        titleLabel={`${title.year}년 ${title.month} — 연간 기록 보기`}
      />

      <Tip id="calendar" className="cal-tip">
        날짜를 누르면 그날 한 영상을 보고, 완료 기록을 고칠 수 있어요.
      </Tip>

      <section className="cal card" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label={`${title.year}년 ${title.month}`}>
        <div className="cal__summary">
          <span>
            기록한 날 <strong className="num">{stats.workoutDays}</strong>일
          </span>
          {hl.on && (
            <span>
              {hl.name} <strong className="num">{stats.strengthDays}</strong>일
            </span>
          )}
          {!isCurrentMonth && (
            <button type="button" className="text-link cal__today" onClick={() => { setMonth(monthKey(todayKey)); setSelected(todayKey); }}>
              오늘로
            </button>
          )}
        </div>
        <div className="cal__weekdays" aria-hidden="true">
          {weekdayLabels(options.weekStartsOn).map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="cal__grid" key={month}>
          {grid.flat().map((key, i) =>
            key ? (
              <CalendarDay
                key={key}
                dateKey={key}
                progress={getProgress(key)}
                isToday={key === todayKey}
                isSelected={key === selected}
                beforeStart={key < appStart}
                onSelect={() => {
                  setSelected(key);
                  requestAnimationFrame(() =>
                    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
                  );
                }}
              />
            ) : (
              <span key={`pad-${i}`} className="cday cday--pad" aria-hidden="true" />
            ),
          )}
        </div>
        <div className="legend" aria-label="범례">
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
      </section>

      <div ref={detailRef} className="cal-detail">
        <DayDetail dateKey={selected} onEditRoutine={onEditRoutine} />
      </div>
      <YearView
        open={yearOpen}
        activeMonth={month}
        onClose={closeYear}
        onSelectMonth={(m) => {
          setMonth(m);
          setYearOpen(false);
        }}
      />
    </div>
  );
}
