import { appConfig } from '../config/appConfig';
import type { DayPlan, DayProgress, DayRecord, RecordMap } from '../types';
import { totalMinutes } from './schedule';
import { addDays, compareKeys, daysInMonth, parseDateKey } from './date';

/** How the 파란색 기록 is read: linked to-do item ids also count, 'off' hides it. */
export interface HighlightRule {
  itemIds: string[];
  off?: boolean;
}

/** Completion summary for one date. */
export function dayProgress(plan: DayPlan, record: DayRecord | undefined, todayKey: string, highlight?: HighlightRule): DayProgress {
  const total = plan.items.length;
  const completedItems = plan.items.filter((item) => record?.done[item.id]);
  const completed = completedItems.length;
  const todosDone = completedItems.filter((item) => item.type === 'todo').length;
  const todoTotal = plan.items.filter((item) => item.type === 'todo').length;
  const minutes = totalMinutes(completedItems);
  const strength =
    !highlight?.off && (record?.strength === true || (highlight?.itemIds ?? []).some((id) => Boolean(record?.done[id])));
  const ratio = total ? completed / total : 0;

  let status: DayProgress['status'];
  if (compareKeys(plan.dateKey, todayKey) > 0) status = 'future';
  else if (total === 0 || (plan.isRest && completed === 0)) status = 'rest';
  else if (completed === total) status = 'full';
  else if (completed > 0) status = 'partial';
  else status = 'none';

  return { total, completed, todosDone, todoTotal, ratio, status, strength, minutes };
}

export type ProgressGetter = (dateKey: string) => DayProgress;

function counts(p: DayProgress, countPartialDays: boolean): boolean {
  return countPartialDays ? p.completed > 0 : p.status === 'full';
}

/** Earliest date that has any completion (streaks never look further back). */
export function earliestRecordKey(records: RecordMap): string | null {
  let min: string | null = null;
  for (const [key, rec] of Object.entries(records)) {
    if (Object.keys(rec.done).length === 0) continue;
    if (!min || key < min) min = key;
  }
  return min;
}

/**
 * Current streak: consecutive counted days ending today (or yesterday, if today
 * isn't done yet — an unfinished today never breaks a streak).
 * Rest days with nothing done are skipped: they neither add to nor break a streak.
 */
export function currentStreak(
  get: ProgressGetter,
  todayKey: string,
  earliest: string | null,
  countPartialDays: boolean = appConfig.streak.countPartialDays,
): number {
  if (!earliest) return 0;
  let streak = 0;
  let key = todayKey;
  if (!counts(get(todayKey), countPartialDays)) key = addDays(todayKey, -1);
  while (compareKeys(key, earliest) >= 0) {
    const p = get(key);
    if (counts(p, countPartialDays)) streak++;
    else if (p.status !== 'rest') break;
    key = addDays(key, -1);
  }
  return streak;
}

export function longestStreak(
  get: ProgressGetter,
  todayKey: string,
  earliest: string | null,
  countPartialDays: boolean = appConfig.streak.countPartialDays,
): number {
  if (!earliest) return 0;
  let best = 0;
  let run = 0;
  for (let key = earliest; compareKeys(key, todayKey) <= 0; key = addDays(key, 1)) {
    const p = get(key);
    if (counts(p, countPartialDays)) {
      run++;
      best = Math.max(best, run);
    } else if (p.status !== 'rest' && key !== todayKey) {
      run = 0;
    }
  }
  return best;
}

export interface MonthStats {
  month: string;
  workoutDays: number;
  fullDays: number;
  strengthDays: number;
  /** finished / planned items (videos + to-dos) */
  completedItems: number;
  scheduledItems: number;
  /** the to-do part of the two numbers above */
  completedTodos: number;
  scheduledTodos: number;
  completionRate: number;
  minutes: number;
  /** One entry per calendar day of the month. */
  daily: { key: string; progress: DayProgress }[];
  /** Days with activity per weekday, index 0 = Sunday. */
  byWeekday: number[];
}

/**
 * Month summary. Completion rate only counts days that are already over, plus
 * today / rest days once something was done on them — so it isn't dragged down
 * by a day that is still in progress. Days before `since` (the first day the app
 * was used) are left out of the numbers entirely.
 */
export function monthStats(month: string, get: ProgressGetter, todayKey: string, since?: string | null): MonthStats {
  const stats: MonthStats = {
    month,
    workoutDays: 0,
    fullDays: 0,
    strengthDays: 0,
    completedItems: 0,
    scheduledItems: 0,
    completedTodos: 0,
    scheduledTodos: 0,
    completionRate: 0,
    minutes: 0,
    daily: [],
    byWeekday: [0, 0, 0, 0, 0, 0, 0],
  };

  for (const key of daysInMonth(month)) {
    const progress = get(key);
    stats.daily.push({ key, progress });
    if (progress.status === 'future') continue;
    if (since && key < since) continue;

    if (progress.completed > 0) {
      stats.workoutDays++;
      stats.byWeekday[parseDateKey(key).getDay()]++;
    }
    if (progress.status === 'full') stats.fullDays++;
    if (progress.strength) stats.strengthDays++;
    stats.minutes += progress.minutes;

    const isToday = key === todayKey;
    const include = progress.completed > 0 || (!isToday && progress.status !== 'rest');
    if (include) {
      stats.completedItems += progress.completed;
      stats.scheduledItems += progress.total;
      stats.completedTodos += progress.todosDone;
      stats.scheduledTodos += progress.todoTotal;
    }
  }
  stats.completionRate = stats.scheduledItems ? stats.completedItems / stats.scheduledItems : 0;
  return stats;
}
