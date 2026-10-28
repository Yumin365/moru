import { describe, expect, it } from 'vitest';
import type { DayPlan, RecordMap, RecurringRule, RoutineItem, WorkoutSchedule } from '../types';
import { addDays, addMonths, isValidDateKey, monthGrid, msUntilMidnight, toDateKey, weekOf } from './date';
import { configStretchDefaults, resolveDay } from './schedule';
import { currentStreak, dayProgress, earliestRecordKey, longestStreak, monthStats } from './stats';
import { parseStartSeconds, parseYouTubeId } from './youtube';

describe('parseYouTubeId', () => {
  const id = 'FJA3R7n_594';
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=30s`,
    `https://m.youtube.com/watch?feature=share&v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abcdef`,
    `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `  ${id}  `,
    `https://youtu.be/${id}&t=43s`,
    `https://www.youtube.com/watch?si=2yVznxURnVOMfSOr&t=158&v=${id}&feature=youtu.be`,
  ])('parses %s', (url) => {
    expect(parseYouTubeId(url)).toBe(id);
  });

  it.each(['', 'https://vimeo.com/123', 'https://youtube.com/watch?v=short', 'not a url', 'https://youtube.com/@channel'])(
    'rejects %s',
    (url) => expect(parseYouTubeId(url)).toBeNull(),
  );

  it('reads start times', () => {
    expect(parseStartSeconds('https://youtu.be/x?t=90')).toBe(90);
    expect(parseStartSeconds('https://youtube.com/watch?v=x&t=1m30s')).toBe(90);
    expect(parseStartSeconds('https://youtube.com/watch?v=x')).toBe(0);
    expect(parseStartSeconds('https://youtu.be/OkRSW7FxTqA&t=1m22s')).toBe(82);
    expect(parseStartSeconds('https://youtu.be/OkRSW7FxTqA&t=43s')).toBe(43);
    expect(parseStartSeconds('https://www.youtube.com/watch?si=abc&t=158&v=dpBYYEhdofI')).toBe(158);
  });
});

describe('dates', () => {
  it('uses local dates and handles month/year rollover', () => {
    expect(toDateKey(new Date(2026, 9, 13, 23, 59))).toBe('2026-10-13');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2026-10-13')).toBe(true);
  });
  it('builds month grids', () => {
    const grid = monthGrid('2026-10', 0); // Oct 1 2026 is a Thursday
    expect(grid[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[0][4]).toBe('2026-10-01');
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
    expect(monthGrid('2026-10', 1)[0][3]).toBe('2026-10-01');
  });
  it('finds the week', () => {
    expect(weekOf('2026-10-13', 0)[0]).toBe('2026-10-11');
    expect(weekOf('2026-10-13', 1)[0]).toBe('2026-10-12');
  });
  it('computes time to midnight', () => {
    const ms = msUntilMidnight(new Date(2026, 9, 13, 23, 59, 0));
    expect(ms).toBeGreaterThan(59_000);
    expect(ms).toBeLessThan(62_000);
  });
});

const video = (title: string) => ({ title, youtubeUrl: 'https://youtu.be/FJA3R7n_594', durationMin: 10 });
const schedule: WorkoutSchedule = {
  '2026-10-10': { workout1: video('A'), workout2: video('B') },
  '2026-10-11': { rest: true },
  '2026-10-12': { workout1: video('C'), workout2: video('D'), stretch2: null },
  '2026-10-13': { workout1: video('E'), workout2: video('F'), stretch1: video('Custom stretch') },
};
const ctx = { schedule, customRoutines: {} as Record<string, RoutineItem[]>, stretches: configStretchDefaults() };

describe('resolveDay', () => {
  it('orders Stretch 1 → Workout 1 → Workout 2 → Stretch 2', () => {
    expect(resolveDay('2026-10-10', ctx).items.map((i) => i.id)).toEqual(['stretch1', 'workout1', 'workout2', 'stretch2']);
  });
  it('supports per-day stretch overrides and removal', () => {
    expect(resolveDay('2026-10-12', ctx).items.map((i) => i.id)).toEqual(['stretch1', 'workout1', 'workout2']);
    expect(resolveDay('2026-10-13', ctx).items[0].title).toBe('Custom stretch');
  });
  it('rest days and unscheduled days only have stretches', () => {
    const rest = resolveDay('2026-10-11', ctx);
    expect(rest.isRest).toBe(true);
    expect(rest.items.every((i) => i.type === 'stretch')).toBe(true);
    expect(resolveDay('2030-01-01', ctx).isScheduled).toBe(false);
  });
  it('custom routines from the editor win', () => {
    const custom = { ...ctx, customRoutines: { '2026-10-10': [{ id: 'x', type: 'workout' as const, title: 'Mine', youtubeUrl: 'y' }] } };
    const plan = resolveDay('2026-10-10', custom);
    expect(plan.isCustom).toBe(true);
    expect(plan.items.map((i) => i.title)).toEqual(['Mine']);
  });
  it('fills missing durations from learned player data', () => {
    const s: WorkoutSchedule = { '2026-10-10': { workout1: { title: 'N', youtubeUrl: 'https://youtu.be/AnYl6Nk9GOA' } } };
    const plan = resolveDay('2026-10-10', { ...ctx, schedule: s, learnedDurations: { AnYl6Nk9GOA: 626 } });
    expect(plan.items.find((i) => i.id === 'workout1')?.durationMin).toBe(10);
  });
});

describe('weekly repeat rules', () => {
  const rule: RecurringRule = {
    id: 'r1',
    type: 'workout',
    title: 'Repeat',
    youtubeUrl: 'https://youtu.be/AnYl6Nk9GOA',
    weekdays: [2, 4], // Tue, Thu
    startDate: '2026-10-13',
  };
  const withRule = (r = rule) => ({ ...ctx, recurring: [r] });
  it('adds the video before the cool-down stretch on matching weekdays', () => {
    const ids = resolveDay('2026-10-13', withRule()).items.map((i) => i.id); // Tue
    expect(ids).toEqual(['stretch1', 'workout1', 'workout2', 'rec-r1', 'stretch2']);
    expect(resolveDay('2026-10-12', withRule()).items.some((i) => i.recurringId)).toBe(false); // Mon
  });
  it('respects start and end dates', () => {
    expect(resolveDay('2026-10-06', withRule()).items.some((i) => i.recurringId)).toBe(false); // before start
    expect(resolveDay('2026-10-20', withRule({ ...rule, endDate: '2026-10-19' })).items.some((i) => i.recurringId)).toBe(false);
  });
  it('also applies on top of custom routines', () => {
    const c = { ...withRule(), customRoutines: { '2026-10-13': [{ id: 'x', type: 'workout' as const, title: 'Mine', youtubeUrl: 'y' }] } };
    expect(resolveDay('2026-10-13', c).items.map((i) => i.id)).toEqual(['x', 'rec-r1']);
  });
  it('is skipped on days that already have the same video', () => {
    const dup = { ...rule, youtubeUrl: 'https://youtube.com/watch?v=FJA3R7n_594&t=10' }; // same id as workout1/2 in the test schedule
    const items = resolveDay('2026-10-13', withRule(dup)).items;
    expect(items.some((i) => i.recurringId)).toBe(false);
    expect(items).toHaveLength(4);
  });
  it('limits default stretches to chosen weekdays from a date on', () => {
    const stretchDays = { stretch1: [{ from: '2026-10-14', days: [1, 3, 5] }] }; // Mon/Wed/Fri from Oct 14
    const c = { ...ctx, stretchDays };
    expect(resolveDay('2026-10-13', c).items[0].id).toBe('stretch1'); // before the change → still every day
    expect(resolveDay('2026-10-15', c).items.some((i) => i.id === 'stretch1')).toBe(false); // Thu
    expect(resolveDay('2026-10-16', c).items[0].id).toBe('stretch1'); // Fri
    expect(resolveDay('2026-10-16', c).items.some((i) => i.id === 'stretch2')).toBe(true); // other slot untouched
  });
  it('uses measured length minus the start time', () => {
    const s: WorkoutSchedule = { '2026-10-10': { workout1: { title: 'T', youtubeUrl: 'https://youtu.be/AnYl6Nk9GOA?t=60' } } };
    const item = resolveDay('2026-10-10', { ...ctx, schedule: s, learnedDurations: { AnYl6Nk9GOA: 660 } }).items.find((i) => i.id === 'workout1');
    expect(item?.durationMin).toBe(10);
    expect(item?.durationSec).toBe(600);
  });
});

describe('progress & streaks', () => {
  const today = '2026-10-13';
  const done = (...ids: string[]) => ({ done: Object.fromEntries(ids.map((id) => [id, 'x'])), updatedAt: 'x' });
  const all = ['stretch1', 'workout1', 'workout2', 'stretch2'];
  const make = (records: RecordMap) => {
    const get = (key: string) => dayProgress(resolveDay(key, ctx), records[key], today);
    return { get, earliest: earliestRecordKey(records) };
  };

  it('classifies days', () => {
    const plan: DayPlan = resolveDay('2026-10-10', ctx);
    expect(dayProgress(plan, undefined, today).status).toBe('none');
    expect(dayProgress(plan, done('workout1'), today)).toMatchObject({ status: 'partial', completed: 1, total: 4, minutes: 10 });
    expect(dayProgress(plan, done(...all), today).status).toBe('full');
    expect(dayProgress(resolveDay('2026-10-20', ctx), undefined, today).status).toBe('future');
    expect(dayProgress(resolveDay('2026-10-11', ctx), undefined, today).status).toBe('rest');
  });

  it('rest days do not break a streak and unfinished today does not either', () => {
    const { get, earliest } = make({ '2026-10-10': done(...all), '2026-10-12': done('workout1') });
    expect(currentStreak(get, today, earliest)).toBe(2); // 10, (11 rest skipped), 12
    expect(longestStreak(get, today, earliest)).toBe(2);
  });

  it('today counts once something is done', () => {
    const { get, earliest } = make({ '2026-10-12': done('workout1'), '2026-10-13': done('stretch1') });
    expect(currentStreak(get, today, earliest)).toBe(2);
  });

  it('a missed scheduled day breaks the streak', () => {
    const records: RecordMap = {
      '2026-10-05': done('stretch1'),
      '2026-10-06': done('stretch1'),
      '2026-10-07': done('stretch1'),
      // 10-08 missed
      '2026-10-09': done('stretch1'),
    };
    const { get, earliest } = make(records);
    expect(currentStreak(get, today, earliest)).toBe(0); // 10-12 and 10-10 missed too
    expect(longestStreak(get, today, earliest)).toBe(3);
  });

  it('month stats leave out days before the first record', () => {
    const { get } = make({ '2026-10-10': done(...all) });
    const s = monthStats('2026-10', get, today, '2026-10-10');
    expect(s.completedVideos).toBe(4);
    expect(s.scheduledVideos).toBe(4 + 3); // 10-10 (4) + 10-12 (3, no cool-down) — 10-11 rest, 10-13 today not started
    expect(monthStats('2026-09', get, today, '2026-10-10').scheduledVideos).toBe(0);
  });
  it('month stats ignore the in-progress today', () => {
    const { get } = make({ '2026-10-10': done(...all), '2026-10-12': done('workout1', 'workout2') });
    const s = monthStats('2026-10', get, today);
    expect(s.workoutDays).toBe(2);
    expect(s.fullDays).toBe(1);
    expect(s.completedVideos).toBe(6);
    // Oct 1–12 are past days; rest days (Sundays 4 & 11) are excluded unless something was done
    expect(s.scheduledVideos).toBeGreaterThan(s.completedVideos);
    expect(s.daily).toHaveLength(31);
  });
});
