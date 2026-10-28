import { useState } from 'react';
import { formatParts } from '../../lib/date';
import type { MonthStats } from '../../lib/stats';

interface DailyChartProps {
  stats: MonthStats;
  todayKey: string;
}

const H = 120;

/** Daily completion (% of the day's videos) for the month — lime for workouts, iris for strength days. */
export function DailyChart({ stats, todayKey }: DailyChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = stats.daily.length;
  const active = hover !== null ? stats.daily[hover] : null;

  return (
    <div className="dchart">
      <div className="dchart__legend" aria-hidden="true">
        <span>
          <i className="dchart__sw dchart__sw--w" /> 운동
        </span>
        <span>
          <i className="dchart__sw dchart__sw--s" /> 근력 운동한 날
        </span>
      </div>

      <div className="dchart__plot" onMouseLeave={() => setHover(null)}>
        <div className="dchart__grid" aria-hidden="true">
          <span data-label="100%" />
          <span data-label="50%" />
          <span />
        </div>
        <div className="dchart__bars" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden="true">
          {stats.daily.map(({ key, progress }, i) => {
            const h = progress.completed > 0 ? Math.max(6, progress.ratio * H) : 0;
            const cls = [
              'dchart__col',
              progress.strength && 'is-strength',
              progress.status === 'future' && 'is-future',
              key === todayKey && 'is-today',
              hover === i && 'is-hover',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div
                key={key}
                className={cls}
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
                onClick={() => setHover(i)}
              >
                <span className="dchart__bar" style={{ height: h }} />
                {progress.status !== 'future' && progress.completed === 0 && <span className="dchart__zero" />}
              </div>
            );
          })}
        </div>
        {active && hover !== null && (
          <div
            className="dchart__tip"
            style={{ left: `${((hover + 0.5) / n) * 100}%` }}
            role="status"
          >
            <strong>{formatParts(active.key).label}</strong>
            <span>
              {active.progress.status === 'future'
                ? '예정'
                : active.progress.status === 'rest' && active.progress.completed === 0
                  ? '휴식일'
                  : `영상 ${active.progress.completed}/${active.progress.total}`}
              {active.progress.strength ? ' · 근력' : ''}
            </span>
          </div>
        )}
      </div>
      <div className="dchart__axis" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden="true">
        {stats.daily.map(({ key }, i) => {
          const d = i + 1;
          const todayIndex = stats.daily.findIndex((x) => x.key === todayKey);
          // weekly ticks, but never squeezed right next to today's label
          const nearToday = todayIndex >= 0 && Math.abs(i - todayIndex) <= 2 && key !== todayKey;
          const show = key === todayKey || ((d === 1 || d % 7 === 1) && !nearToday);
          return (
            <span key={key} className={key === todayKey ? 'is-today' : undefined} style={{ gridColumn: i + 1 }}>
              {show ? d : ''}
            </span>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>일별 완료 현황</caption>
        <thead>
          <tr>
            <th>날짜</th>
            <th>완료</th>
            <th>근력 운동</th>
          </tr>
        </thead>
        <tbody>
          {stats.daily
            .filter((d) => d.progress.status !== 'future')
            .map(({ key, progress }) => (
              <tr key={key}>
                <td>{key}</td>
                <td>
                  {progress.total}개 중 {progress.completed}개
                </td>
                <td>{progress.strength ? '예' : '아니요'}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
