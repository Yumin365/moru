/**
 * "파란색 기록": the second colour on the calendar. By default it marks strength
 * training days, but anyone can rename it (명상, 만보 걷기…) and choose how it is
 * recorded: answering a question, or by checking off a linked repeating to-do.
 * The answer is still stored as DayRecord.strength.
 */
export type HighlightMode = 'ask' | 'todo' | 'off';

export const HIGHLIGHT_ICONS = [
  'dumbbell',
  'flower',
  'footprints',
  'bike',
  'salad',
  'droplets',
  'pill',
  'book',
  'brain',
  'moon',
  'heart',
  'sparkles',
] as const;
export type HighlightIconKey = (typeof HIGHLIGHT_ICONS)[number];

export interface HighlightSettings {
  mode: HighlightMode;
  name: string;
  icon: HighlightIconKey;
  /** repeating to-do that counts (mode 'todo') */
  ruleId?: string;
  /** to-dos linked before — their old checks still count */
  pastRuleIds?: string[];
  /** mode 'ask': also ask on the completion screen (off = only the button on 오늘) */
  askAfterWorkout?: boolean;
}

export const DEFAULT_HIGHLIGHT: HighlightSettings = { mode: 'ask', name: '근력 운동', icon: 'dumbbell' };

export const MAX_HIGHLIGHT_NAME = 12;

/** 을 / 를 after a word (by its last syllable's final consonant). */
export function objectParticle(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return '을(를)';
  return code % 28 === 0 ? '를' : '을';
}

/** "근력 운동한 날", "명상한 날", "만보 걷기 한 날" */
export function highlightDayLabel(name: string): string {
  const n = name.trim();
  return /기$/.test(n) ? `${n} 한 날` : `${n}한 날`;
}

/** "오늘 명상을 했나요?" */
export function highlightQuestion(name: string): string {
  const n = name.trim();
  return `오늘 ${n}${objectParticle(n)} 했나요?`;
}

export const HIGHLIGHT_MODE_LABEL: Record<HighlightMode, string> = {
  ask: '직접 답하기',
  todo: '할 일로 체크',
  off: '사용 안 함',
};
