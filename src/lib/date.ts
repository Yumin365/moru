/** Date helpers. All keys are LOCAL dates formatted 'YYYY-MM-DD' (never UTC). */

const WEEKDAYS_LONG = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
export const WEEKDAYS_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDateKey(key)) === key;
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Negative when a < b. Works across DST changes because it compares calendar dates. */
export function compareKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function daysInMonth(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const count = new Date(y, m, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`);
}

/** 6×7 (or 5×7) grid of keys for a month; `null` for padding cells. */
export function monthGrid(month: string, weekStartsOn: 0 | 1): (string | null)[][] {
  const days = daysInMonth(month);
  const lead = (parseDateKey(days[0]).getDay() - weekStartsOn + 7) % 7;
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** The 7 keys of the week containing `key`. */
export function weekOf(key: string, weekStartsOn: 0 | 1): string[] {
  const offset = (parseDateKey(key).getDay() - weekStartsOn + 7) % 7;
  const start = addDays(key, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayLabels(weekStartsOn: 0 | 1): string[] {
  return Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(i + weekStartsOn) % 7]);
}

/** [1,3,5] → '월·수·금' (or 매일 / 평일 / 주말) */
export function weekdaysLabel(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return '매일';
  if (sorted.join() === '1,2,3,4,5') return '평일';
  if (sorted.join() === '0,6') return '주말';
  return sorted.map((n) => WEEKDAYS_SHORT[n]).join('·');
}

export function formatParts(key: string) {
  const d = parseDateKey(key);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return {
    month,
    day,
    year: d.getFullYear(),
    /** '화요일' */
    weekday: WEEKDAYS_LONG[d.getDay()],
    /** '화' */
    weekdayShort: WEEKDAYS_SHORT[d.getDay()],
    /** '10월 13일' */
    label: `${month}월 ${day}일`,
  };
}

export function formatMonthTitle(month: string): { month: string; year: number } {
  const [y, m] = month.split('-').map(Number);
  return { month: `${m}월`, year: y };
}

/** Milliseconds until the next local midnight (+ a small buffer). */
export function msUntilMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}
