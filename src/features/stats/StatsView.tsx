import { CalendarCheck, Clock3, ListChecks } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { MonthHeader } from '../../components/MonthHeader';
import { ProgressRing } from '../../components/ProgressRing';
import { StreakCards } from '../../components/StreakCards';
import { HighlightIcon } from '../../components/HighlightIcon';
import { addMonths, formatMonthTitle, monthKey } from '../../lib/date';
import { monthStats } from '../../lib/stats';
import { useStore } from '../../state/WorkoutStore';
import { useHighlight } from '../../state/useHighlight';
import { DailyChart } from './DailyChart';
import { YearStatsView } from './YearStatsView';
import './stats.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function Tile({ icon, value, unit, label, tone }: { icon: ReactNode; value: ReactNode; unit?: string; label: string; tone?: string }) {
  return (
    <div className={`tile${tone ? ` tile--${tone}` : ''}`}>
      <span className="tile__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="tile__value num">
        {value}
        {unit && <span>{unit}</span>}
      </div>
      <div className="tile__label">{label}</div>
    </div>
  );
}

export function StatsView() {
  const { todayKey, getProgress, appStart } = useStore();
  const hl = useHighlight();
  const [month, setMonth] = useState(monthKey(todayKey));
  const [yearOpen, setYearOpen] = useState(false);
  const closeYear = useCallback(() => setYearOpen(false), []);
  const since = appStart;
  const stats = useMemo(() => monthStats(month, getProgress, todayKey, since), [month, getProgress, todayKey, since]);
  const title = formatMonthTitle(month);
  const isCurrent = month === monthKey(todayKey);
  const isFutureMonth = month > monthKey(todayKey);
  const pct = Math.round(stats.completionRate * 100);
  const maxWeekday = Math.max(1, ...stats.byWeekday);
  const top = Math.max(...stats.byWeekday);
  // Only call out a weekday when it is clearly ahead (no ties).
  const best = top > 0 && stats.byWeekday.filter((v) => v === top).length === 1 ? WEEKDAYS[stats.byWeekday.indexOf(top)] : null;

  return (
    <div className="stats screen">
      <MonthHeader
        year={title.year}
        month={title.month}
        suffix="통계"
        onPrev={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, 1))}
        nextDisabled={isCurrent}
        prevDisabled={month <= monthKey(appStart)}
        onTitleClick={() => setYearOpen(true)}
        titleLabel={`${title.year}년 ${title.month} 통계 — 연간 통계 보기`}
      />

      <section className="rate card-dark" aria-label="완료율">
        <ProgressRing
          value={stats.completionRate}
          size={132}
          stroke={13}
          track="rgba(255,255,255,0.09)"
          color="var(--accent-bright)"
          label={`완료율 ${pct}%`}
        >
          <span className="rate__pct num">
            {pct}
            <small>%</small>
          </span>
        </ProgressRing>
        <div className="rate__text">
          <div className="rate__label">이번 달 완료율</div>
          <div className="rate__big num">
            {stats.completedItems}
            <span> / {stats.scheduledItems}</span>
          </div>
          <div className="rate__sub">완료한 항목</div>
          <div className="rate__bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
          {stats.scheduledTodos > 0 && (
            <div className="rate__split num">
              <span>
                영상 {stats.completedItems - stats.completedTodos}/{stats.scheduledItems - stats.scheduledTodos}
              </span>
              <span>
                할 일 {stats.completedTodos}/{stats.scheduledTodos}
              </span>
            </div>
          )}
        </div>
      </section>

      <StreakCards />

      <div className="tiles">
        <Tile icon={<CalendarCheck size={18} strokeWidth={2.4} />} value={stats.workoutDays} unit="일" label="기록한 날" tone="accent" />
        <Tile icon={<Clock3 size={18} strokeWidth={2.4} />} value={stats.minutes} unit="분" label="운동 시간" />
        {hl.on ? (
          <Tile icon={<HighlightIcon icon={hl.icon} size={18} />} value={stats.strengthDays} unit="일" label={hl.dayLabel} tone="iris" />
        ) : (
          <Tile icon={<ListChecks size={18} strokeWidth={2.4} />} value={stats.completedTodos} unit="개" label="완료한 할 일" />
        )}
        <Tile icon={<CalendarCheck size={18} strokeWidth={2.4} />} value={stats.fullDays} unit="일" label="모두 완료한 날" />
      </div>

      <section className="chart-card card">
        <div className="chart-card__head">
          <div>
            <h2 className="chart-card__title">일별 완료율</h2>
            <p className="chart-card__sub">그날 루틴(영상·할 일) 중 완료한 비율</p>
          </div>
        </div>
        {isFutureMonth ? <p className="chart-card__empty">아직 시작되지 않은 달이에요.</p> : <DailyChart stats={stats} todayKey={todayKey} />}
      </section>

      <section className="chart-card card">
        <div className="chart-card__head">
          <div>
            <h2 className="chart-card__title">요일별 리듬</h2>
            <p className="chart-card__sub">{best ? `${best}요일에 가장 꾸준해요` : '요일별로 기록한 날 수'}</p>
          </div>
        </div>
        <div className="wk" role="list" aria-label="요일별 기록한 날">
          {stats.byWeekday.map((v, i) => (
            <div key={WEEKDAYS[i]} className="wk__col" role="listitem" aria-label={`${WEEKDAYS[i]}요일: ${v}일`}>
              <span className="wk__val num">{v || ''}</span>
              <span className="wk__track">
                <span className="wk__bar" style={{ height: `${(v / maxWeekday) * 100}%` }} />
              </span>
              <span className="wk__label">{WEEKDAYS[i]}</span>
            </div>
          ))}
        </div>
      </section>
      <YearStatsView
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
