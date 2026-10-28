import { describe, expect, it } from 'vitest';
import { daysInMonth, parseDateKey } from './date';
import { buildBookmarklet, buildScheduleDays, guessMonth, mapToMonth, parseJinyPayload, type JinyAnchor, type JinyPayload } from './jiny';

/** Builds anchors the way the Jiny calendar image places them (Sunday first, header ≈5%). */
function synthCalendar(month: string, perDay: (day: number) => string[], header = 0.05): JinyPayload {
  const days = daysInMonth(month);
  const lead = parseDateKey(days[0]).getDay();
  const rows = Math.ceil((lead + days.length) / 7);
  const rowH = (1 - header) / rows;
  const anchors: JinyAnchor[] = [];
  days.forEach((_, i) => {
    const cell = lead + i;
    const col = cell % 7;
    const row = Math.floor(cell / 7);
    const ids = perDay(i + 1);
    ids.forEach((id, k) => {
      const h = ids.length === 1 ? rowH * 0.95 : rowH * 0.48;
      anchors.push({ href: `https://youtu.be/${id}&t=43s`, x: col / 7 + 0.001, y: header + row * rowH + k * rowH * 0.5, w: 1 / 7 - 0.003, h });
    });
  });
  return { app: 'daily-fit-jiny', v: 1, capturedAt: '2026-09-25', anchors };
}

const A = 'OkRSW7FxTqA';
const B = 'dpBYYEhdofI';
const C = 'GToUE4OLJ8c';

describe('jiny import', () => {
  const october = synthCalendar('2026-10', (d) => (d >= 8 && d <= 28 ? [A, B] : d === 15 ? [] : [C]));

  it('maps every link to its date', () => {
    const map = mapToMonth(october, '2026-10');
    expect(map.outside).toBe(0);
    expect(map.days['2026-10-01']).toHaveLength(1);
    expect(map.days['2026-10-08'].map((h) => h.slice(17, 28))).toEqual([A, B]);
    expect(map.days['2026-10-31']).toHaveLength(1);
  });

  it('guesses the month from the layout (captured in September → October)', () => {
    expect(guessMonth(october, '2026-09-25')).toBe('2026-10');
    const june = synthCalendar('2026-06', () => [A]);
    expect(guessMonth({ ...june, capturedAt: '2026-06-02' }, '2026-06-02')).toBe('2026-06');
  });

  it('builds schedule days with names, start times and rest days', () => {
    const sparse = synthCalendar('2026-10', (d) => (d === 4 ? [] : [A]));
    const days = buildScheduleDays(mapToMonth(sparse, '2026-10'), (id) => (id === A ? '전신 컨디셔닝' : id));
    expect(Object.keys(days)).toHaveLength(31);
    expect(days['2026-10-04']).toEqual({ rest: true });
    expect(days['2026-10-05'].workout1).toMatchObject({ title: '전신 컨디셔닝', category: '지니다이어트' });
    expect(days['2026-10-05'].workout1?.youtubeUrl).toContain('t=43s');
  });

  it('round-trips the payload through the URL hash', () => {
    const hash = '#jiny=' + encodeURIComponent(JSON.stringify(october));
    expect(parseJinyPayload(hash)?.anchors).toHaveLength(october.anchors.length);
    expect(parseJinyPayload('not json')).toBeNull();
    expect(parseJinyPayload(JSON.stringify({ app: 'other', anchors: [] }))).toBeNull();
  });

  it('produces a single-line javascript: bookmarklet', () => {
    const bm = buildBookmarklet('https://me.github.io/moru/');
    expect(bm.startsWith('javascript:(function(){')).toBe(true);
    expect(bm).not.toContain('\n');
    expect(bm).toContain('"https://me.github.io/moru/"');
    // the code must be valid JavaScript
    expect(() => new Function(bm.slice('javascript:'.length))).not.toThrow();
  });
});
