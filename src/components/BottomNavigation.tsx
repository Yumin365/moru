import { CalendarDays, ChartColumn, House } from 'lucide-react';
import type { ComponentType } from 'react';
import './navigation.css';

export type TabId = 'today' | 'calendar' | 'stats';

const TABS: { id: TabId; label: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'today', label: '오늘', Icon: House },
  { id: 'calendar', label: '캘린더', Icon: CalendarDays },
  { id: 'stats', label: '통계', Icon: ChartColumn },
];

interface BottomNavigationProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="메인 메뉴">
      <div className="bottom-nav__bar" role="tablist">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              className={`bottom-nav__item${isActive ? ' is-active' : ''}`}
              onClick={() => onChange(id)}
            >
              <span className="bottom-nav__pill">
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2.1} />
                <span className="bottom-nav__label">{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
