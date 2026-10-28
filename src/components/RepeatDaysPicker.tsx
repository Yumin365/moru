import { WEEKDAYS_SHORT } from '../lib/date';
import { EVERY_DAY } from '../lib/schedule';
import { Toggle } from './Checkbox';

interface RepeatDaysPickerProps {
  days: number[];
  /** "특정 요일만" is open */
  specific: boolean;
  onChange: (days: number[], specific: boolean) => void;
  /** weekday pre-selected when "특정 요일만" is switched on */
  defaultDay: number;
}

/** "특정 요일만 반복하고 싶어요" switch + 일–토 buttons (off = every day). */
export function RepeatDaysPicker({ days, specific, onChange, defaultDay }: RepeatDaysPickerProps) {
  const toggleDay = (day: number) => {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange([...next].sort((a, b) => a - b), true);
  };
  return (
    <>
      <div className="repeat__row repeat__row--sub">
        <span className="repeat__sublabel">특정 요일만 반복하고 싶어요</span>
        <Toggle
          checked={specific}
          onChange={(on) => onChange(on ? [defaultDay] : [...EVERY_DAY], on)}
          label="특정 요일만 반복"
        />
      </div>
      {specific && (
        <div className="repeat__days" role="group" aria-label="반복할 요일">
          {WEEKDAYS_SHORT.map((label, day) => {
            const on = days.includes(day);
            return (
              <button
                key={label}
                type="button"
                className={`repeat__day${on ? ' is-on' : ''}${day === 0 ? ' is-sun' : ''}`}
                aria-pressed={on}
                aria-label={`${label}요일`}
                onClick={() => toggleDay(day)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
