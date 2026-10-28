import { CalendarCheck, ChevronLeft, ChevronRight, Clock3, Dumbbell, Percent, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../components/Button';
import { monthKey } from '../../lib/date';
import { monthStats, type MonthStats } from '../../lib/stats';
import { useBackButton } from '../../state/useBackButton';
import { useStore } from '../../state/WorkoutStore';
import '../calendar/year.css';
import './stats.css';

interface YearStatsViewProps {
  open: boolean;
  /** Month currently shown on the stats page ('YYYY-MM') */
  activeMonth: string;
  onClose: () => void;
  onSelectMonth: (month: string) => void;
}

const pct = (s: MonthStats) => Math.round(s.completionRate * 100);

/** The year by month: totals, a workout-days chart and one card per month. */
export function YearStatsView({ open, activeMonth, onClose, onSelectMonth }: YearStatsViewProps) {
  const { todayKey, getProgress, appStart } = useStore();
  const since = appStart;
  const startMonth = monthKey(appStart);
  const startYear = Number(startMonth.slice(0, 4));
  const currentMonth = monthKey(todayKey);
  const currentYear = Number(currentMonth.slice(0, 4));
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
        // months before the app was first used have no numbers and can't be opened
        const started = key >= startMonth;
        return { key, label: `${i + 1}월`, future: key > currentMonth, started, stats: monthStats(key, getProgress, todayKey, since) };
      }),
    [year, currentMonth, getProgress, todayKey, since],
  );

  const totals = useMemo(() => {
    let days = 0;
    let strength = 0;
    let minutes = 0;
    let done = 0;
    let planned = 0;
    for (const m of months) {
      if (!m.started) continue;
      days += m.stats.workoutDays;
      strength += m.stats.strengthDays;
      minutes += m.stats.minutes;
      done += m.stats.completedVideos;
      planned += m.stats.scheduledVideos;
    }
    return { days, strength, minutes, rate: planned ? Math.round((done / planned) * 100) : 0 };
  }, [months]);

  if (!open) return null;

  const maxDays = Math.max(1, ...months.map((m) => m.stats.workoutDays));

  return createPortal(
    <div className="yearview" role="dialog" aria-modal="true" aria-label={`${year}년 연간 통계`}>
      <div className="yearview__inner">
        <div className="yearview__top">
          <IconButton label="닫기" onClick={onClose}>
            <X size={20} strokeWidth={2.4} />
          </IconButton>
        </div>

        <header className="month-header">
          <IconButton label="이전 해" onClick={() => setYear((y) => y - 1)} disabled={year <= startYear}>
            <ChevronLeft size={20} strokeWidth={2.4} />
          </IconButton>
          <div className="month-header__title">
            <div className="overline">연간 통계</div>
            <h1 className="screen-title num">{year}년</h1>
          </div>
          <IconButton label="다음 해" onClick={() => setYear((y) => y + 1)} disabled={year >= currentYear}>
            <ChevronRight size={20} strokeWidth={2.4} />
          </IconButton>
        </header>

        <div className="ystats-totals">
          <div className="ystats-total">
            <CalendarCheck size={17} strokeWidth={2.4} className="ystats-total__icon is-accent" />
            <div className="ystats-total__value num">
              {totals.days}
              <span>일</span>
            </div>
            <div className="ystats-total__label">운동한 날</div>
          </div>
          <div className="ystats-total">
            <Percent size={17} strokeWidth={2.4} className="ystats-total__icon is-accent" />
            <div className="ystats-total__value num">
              {totals.rate}
              <span>%</span>
            </div>
            <div className="ystats-total__label">완료율</div>
          </div>
          <div className="ystats-total">
            <Clock3 size={17} strokeWidth={2.4} className="ystats-total__icon" />
            <div className="ystats-total__value num">
              {totals.minutes}
              <span>분</span>
            </div>
            <div className="ystats-total__label">운동 시간</div>
          </div>
          <div className="ystats-total">
            <Dumbbell size={17} strokeWidth={2.4} className="ystats-total__icon is-iris" />
            <div className="ystats-total__value num">
              {totals.strength}
              <span>일</span>
            </div>
            <div className="ystats-total__label">근력 운동</div>
          </div>
        </div>

        <section className="chart-card card" aria-label="월별 운동한 날">
          <h2 className="chart-card__title">월별 운동한 날</h2>
          <div className="ymchart" role="list">
            {months.map((m) => (
              <button
                key={m.key}
                type="button"
                role="listitem"
                className={`ymchart__col${m.key === activeMonth ? ' is-active' : ''}${m.future || !m.started ? ' is-future' : ''}`}
                disabled={m.future || !m.started}
                onClick={() => onSelectMonth(m.key)}
                aria-label={`${m.label}: 운동한 날 ${m.stats.workoutDays}일`}
              >
                <span className="ymchart__val num">{m.stats.workoutDays || ''}</span>
                <span className="ymchart__track">
                  <span className="ymchart__bar" style={{ height: `${(m.stats.workoutDays / maxDays) * 100}%` }} />
                </span>
                <span className="ymchart__label num">{m.label.replace('월', '')}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="ystats-grid">
          {months.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`ystat${m.key === activeMonth ? ' is-active' : ''}${m.key === currentMonth ? ' is-current' : ''}${m.future || !m.started ? ' is-future' : ''}`}
              disabled={m.future || !m.started}
              onClick={() => onSelectMonth(m.key)}
              aria-label={`${year}년 ${m.label} 통계`}
            >
              <span className="ystat__head">
                <span className="ystat__label">{m.label}</span>
                {!m.future && m.started && m.stats.scheduledVideos > 0 && <span className="ystat__pct num">{pct(m.stats)}%</span>}
              </span>
              {m.future || !m.started ? (
                <span className="ystat__meta">{m.future ? '예정' : '시작 전'}</span>
              ) : (
                <>
                  {m.started && m.stats.scheduledVideos > 0 && (
                    <span className="ystat__bar" aria-hidden="true">
                      <span style={{ width: `${pct(m.stats)}%` }} />
                    </span>
                  )}
                  <span className="ystat__meta">
                    {m.stats.workoutDays ? `${m.stats.workoutDays}일 · ${m.stats.minutes}분` : '기록 없음'}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
