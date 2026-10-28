import { Flame, Trophy } from 'lucide-react';
import { useStore } from '../state/WorkoutStore';
import './streak-cards.css';

/** Current & longest streak, side by side. */
export function StreakCards() {
  const { streak } = useStore();
  return (
    <div className="streak-cards">
      <div className={`streak-card${streak.current > 0 ? ' is-hot' : ''}`}>
        <span className="streak-card__icon">
          <Flame size={20} strokeWidth={2.4} />
        </span>
        <div>
          <div className="streak-card__value num">
            {streak.current}
            <span>일</span>
          </div>
          <div className="streak-card__label">현재 연속 기록</div>
        </div>
      </div>
      <div className="streak-card">
        <span className="streak-card__icon streak-card__icon--trophy">
          <Trophy size={19} strokeWidth={2.4} />
        </span>
        <div>
          <div className="streak-card__value num">
            {streak.longest}
            <span>일</span>
          </div>
          <div className="streak-card__label">최장 연속 기록</div>
        </div>
      </div>
    </div>
  );
}
