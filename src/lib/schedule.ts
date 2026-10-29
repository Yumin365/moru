import { appConfig } from '../config/appConfig';
import type { DayPlan, RecurringRule, RoutineItem, SlotId, TodoMap, VideoRef, WorkoutSchedule, WorkoutType } from '../types';
import { parseDateKey } from './date';
import { parseStartSeconds, parseYouTubeId } from './youtube';

export const SLOT_ORDER: SlotId[] = ['stretch1', 'workout1', 'workout2', 'stretch2'];

export const SLOT_LABEL: Record<SlotId, string> = {
  stretch1: '스트레칭 1',
  workout1: '운동 1',
  workout2: '운동 2',
  stretch2: '스트레칭 2',
};

export interface StretchDefaults {
  stretch1: VideoRef | null;
  stretch2: VideoRef | null;
}

/** Stretch overrides saved from Settings: undefined = use config, null = no stretch. */
export interface StretchOverrides {
  stretch1?: VideoRef | null;
  stretch2?: VideoRef | null;
}

export function configStretchDefaults(): StretchDefaults {
  return {
    stretch1: appConfig.defaultStretchVideo,
    stretch2: appConfig.defaultStretch2Video ?? appConfig.defaultStretchVideo,
  };
}

export function mergeStretchDefaults(overrides: StretchOverrides): StretchDefaults {
  const base = configStretchDefaults();
  return {
    stretch1: overrides.stretch1 === undefined ? base.stretch1 : overrides.stretch1,
    stretch2: overrides.stretch2 === undefined ? base.stretch2 : overrides.stretch2,
  };
}

export function slotType(slot: SlotId): WorkoutType {
  return slot.startsWith('stretch') ? 'stretch' : 'workout';
}

export function toRoutineItem(id: string, type: WorkoutType, ref: VideoRef): RoutineItem {
  return {
    id,
    type,
    title: ref.title,
    youtubeUrl: ref.youtubeUrl,
    durationMin: ref.durationMin,
    category: ref.category,
  };
}

export const isTodo = (item: Pick<RoutineItem, 'type'>) => item.type === 'todo';
export const isVideo = (item: Pick<RoutineItem, 'type'>) => item.type !== 'todo';

export const TYPE_LABEL: Record<RoutineItem['type'], string> = { workout: '운동', stretch: '스트레칭', todo: '할 일' };

export function itemCategory(item: Pick<RoutineItem, 'type' | 'category'>): string {
  if (item.type === 'todo') return item.category ?? '';
  return item.category || (item.type === 'stretch' ? appConfig.defaultStretchCategory : appConfig.defaultWorkoutCategory);
}

export interface ResolveContext {
  schedule: WorkoutSchedule;
  customRoutines: Record<string, RoutineItem[]>;
  stretches: StretchDefaults;
  /** videoId → seconds, learned from the player */
  learnedDurations?: Record<string, number>;
  /** weekly repeat rules */
  recurring?: RecurringRule[];
  /** which weekdays the default stretches run on (versioned by start date); default = every day */
  stretchDays?: StretchDays;
  /** one-off to-dos per date */
  todos?: TodoMap;
  /** the user's preferred item order (ids), set by long-press reordering */
  order?: string[];
}

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export type StretchSlot = 'stretch1' | 'stretch2';
/** Each slot: list of { from: 'YYYY-MM-DD', days } — the latest version on or before a date wins. */
export type StretchDays = Partial<Record<StretchSlot, { from: string; days: number[] }[]>>;

/** Weekdays a default stretch runs on, for a given date (every day unless changed). */
export function stretchDaysOn(stretchDays: StretchDays | undefined, slot: StretchSlot, dateKey: string): number[] {
  const versions = stretchDays?.[slot] ?? [];
  let days = EVERY_DAY;
  for (const v of versions) if (v.from <= dateKey) days = v.days;
  return days;
}

export function ruleApplies(rule: RecurringRule, dateKey: string): boolean {
  return (
    rule.weekdays.includes(parseDateKey(dateKey).getDay()) &&
    dateKey >= rule.startDate &&
    (!rule.endDate || dateKey <= rule.endDate)
  );
}

export function recurringItemId(ruleId: string): string {
  return `rec-${ruleId}`;
}

function ruleToItem(rule: RecurringRule): RoutineItem {
  return {
    id: recurringItemId(rule.id),
    type: rule.type,
    title: rule.title,
    youtubeUrl: rule.youtubeUrl,
    durationMin: rule.durationMin,
    category: rule.category,
    recurringId: rule.id,
  };
}

/**
 * Repeat items go right before the cool-down stretch (or at the end).
 * A repeat is skipped on days that already contain the same YouTube video.
 */
function withRecurring(items: RoutineItem[], dateKey: string, rules: RecurringRule[] | undefined): RoutineItem[] {
  const extra = (rules ?? []).filter((r) => r.type !== 'todo' && ruleApplies(r, dateKey)).map(ruleToItem);
  if (!extra.length) return items;
  const presentIds = new Set(items.map((i) => i.id));
  const presentVideos = new Set(items.map((i) => parseYouTubeId(i.youtubeUrl)).filter(Boolean));
  const add: RoutineItem[] = [];
  for (const item of extra) {
    const video = parseYouTubeId(item.youtubeUrl);
    if (presentIds.has(item.id) || (video && presentVideos.has(video))) continue;
    add.push(item);
    if (video) presentVideos.add(video);
  }
  if (!add.length) return items;
  const at = items.findIndex((i) => i.id === 'stretch2');
  return at >= 0 ? [...items.slice(0, at), ...add, ...items.slice(at)] : [...items, ...add];
}

/** To-dos of a day (repeating + one-off), newest first — new ones land at the top. */
function todosFor(dateKey: string, ctx: ResolveContext): RoutineItem[] {
  const repeating = (ctx.recurring ?? [])
    .filter((r) => r.type === 'todo' && ruleApplies(r, dateKey))
    .map((r) => ({ item: ruleToItem(r), at: r.createdAt ?? r.startDate }));
  const oneOff = (ctx.todos?.[dateKey] ?? []).map((t) => ({
    item: { id: t.id, type: 'todo' as const, title: t.title, youtubeUrl: '', todoId: t.id },
    at: t.createdAt,
  }));
  return [...repeating, ...oneOff].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).map((x) => x.item);
}

/**
 * Applies the user's order without moving items it doesn't know yet: known items
 * are re-sorted among the places they already occupy, so a brand-new to-do stays
 * on top and a new video keeps its natural spot.
 */
export function applyOrder(items: RoutineItem[], order: string[] | undefined): RoutineItem[] {
  if (!order?.length) return items;
  const rank = new Map(order.map((id, i) => [id, i]));
  const places = items.flatMap((item, i) => (rank.has(item.id) ? [i] : []));
  if (places.length < 2) return items;
  const sorted = places.map((i) => items[i]).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  const out = [...items];
  places.forEach((place, k) => (out[place] = sorted[k]));
  return out;
}

/** Puts a day's new sequence into the global order, where that day's first item used to be. */
export function mergeOrder(order: string[], sequence: string[]): string[] {
  const moved = new Set(sequence);
  const first = order.findIndex((id) => moved.has(id));
  const rest = order.filter((id) => !moved.has(id));
  const at = first < 0 ? 0 : first;
  return [...rest.slice(0, at), ...sequence, ...rest.slice(at)];
}

/** Fills in the length from the measured video duration, minus the part skipped by a `t=` start time. */
function withLearnedDuration(item: RoutineItem, learned?: Record<string, number>): RoutineItem {
  if (item.type === 'todo' || item.durationMin || !learned) return item;
  const id = parseYouTubeId(item.youtubeUrl);
  const seconds = id ? learned[id] : undefined;
  if (!seconds) return item;
  const played = Math.max(30, seconds - parseStartSeconds(item.youtubeUrl));
  return { ...item, durationMin: Math.max(1, Math.round(played / 60)), durationSec: Math.round(played) };
}

/** Turns schedule + defaults + in-app edits into the ordered list of videos for one date. */
export function resolveDay(dateKey: string, ctx: ResolveContext): DayPlan {
  const day = ctx.schedule[dateKey];
  const isScheduled = Boolean(day);
  const isRest = Boolean(day?.rest);
  const custom = ctx.customRoutines[dateKey];

  let items: RoutineItem[];
  if (custom) {
    items = custom;
  } else {
    items = [];
    const workoutsAllowed = isScheduled && !isRest;
    for (const slot of SLOT_ORDER) {
      const type = slotType(slot);
      let ref: VideoRef | null | undefined;
      if (type === 'stretch') {
        const override = day?.[slot as StretchSlot];
        if (override === undefined) {
          // the default (daily) stretch — unless it was limited to certain weekdays
          const days = stretchDaysOn(ctx.stretchDays, slot as StretchSlot, dateKey);
          if (!days.includes(parseDateKey(dateKey).getDay())) continue;
          ref = ctx.stretches[slot as StretchSlot];
        } else {
          ref = override;
        }
      } else {
        if (!workoutsAllowed) continue;
        ref = day?.[slot as 'workout1' | 'workout2'];
      }
      if (ref && ref.youtubeUrl) items.push(toRoutineItem(slot, type, ref));
    }
  }

  items = withRecurring(items, dateKey, ctx.recurring);
  items = applyOrder([...todosFor(dateKey, ctx), ...items], ctx.order);

  return {
    dateKey,
    items: items.map((item) => withLearnedDuration(item, ctx.learnedDurations)),
    isRest,
    isScheduled,
    isCustom: Boolean(custom),
    note: day?.note,
  };
}

/** Sum of video lengths, rounded once at the end (seconds when measured, else the given minutes). */
export function totalMinutes(items: RoutineItem[]): number {
  const seconds = items.filter(isVideo).reduce((sum, item) => sum + (item.durationSec ?? (item.durationMin ?? 0) * 60), 0);
  return Math.round(seconds / 60);
}

/** Total length + whether every video's length is known yet. */
export function durationSummary(items: RoutineItem[]): { minutes: number; complete: boolean; label: string } {
  const minutes = totalMinutes(items);
  const complete = items.filter(isVideo).every((i) => i.durationMin);
  return { minutes, complete, label: minutes ? `${minutes}분${complete ? '' : '+'}` : '' };
}

export function newItemId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
