import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { appConfig } from '../config/appConfig';
import { workoutSchedule } from '../data/workoutSchedule';
import {
  mergeOrder,
  mergeStretchDefaults,
  resolveDay,
  type ResolveContext,
  type StretchDays,
  type StretchOverrides,
  type StretchSlot,
} from '../lib/schedule';
import { currentStreak, dayProgress, earliestRecordKey, longestStreak } from '../lib/stats';
import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { addDays } from '../lib/date';
import type { DayPlan, DayProgress, DayRecord, RecordMap, RecurringRule, RoutineItem, ScheduleDay, TodoMap, VideoRef } from '../types';
import { setDurationListener } from '../lib/durationProbe';
import { DEFAULT_HIGHLIGHT, type HighlightSettings } from '../lib/highlight';
import { recurringItemId } from '../lib/schedule';
import { useToday } from './useToday';

interface Prefs {
  stretches: StretchOverrides;
  /** videoId → name chosen when importing (e.g. the short label from the Jiny calendar) */
  videoNames?: Record<string, string>;
  /** weekdays the default stretches run on, versioned by start date */
  stretchDays?: StretchDays;
  /** app options chosen in Settings (fall back to appConfig) */
  options?: Partial<AppOptions>;
  lastBackupAt?: string;
  /** first day the app was used ('YYYY-MM-DD') */
  startedOn?: string;
  /** item ids in the order the user arranged them (long-press reorder) */
  itemOrder?: string[];
  /** what the second (blue) calendar colour means */
  highlight?: HighlightSettings;
}

export interface AppOptions {
  /** true: a day with ≥1 finished video keeps the streak; false: only fully completed days */
  countPartialDays: boolean;
  weekStartsOn: 0 | 1;
}

/** A month imported from jinydiet.com — stored on this device only. */
export interface ImportedMonth {
  importedAt: string;
  source: 'jinydiet';
  days: Record<string, ScheduleDay>;
}
export type ImportedMonths = Record<string, ImportedMonth>;

type VideoMeta = Record<string, { durationSec?: number }>;

export interface BackupFile {
  app: 'daily-fit';
  version: 1;
  exportedAt: string;
  records: RecordMap;
  routines: Record<string, RoutineItem[]>;
  prefs: Prefs;
  imported?: ImportedMonths;
  recurring?: RecurringRule[];
  todos?: TodoMap;
}

interface Store {
  todayKey: string;
  now: Date;
  records: RecordMap;
  getPlan: (dateKey: string) => DayPlan;
  getProgress: (dateKey: string) => DayProgress;
  streak: { current: number; longest: number };
  setItemDone: (dateKey: string, itemId: string, done: boolean) => void;
  setStrength: (dateKey: string, value: boolean | undefined) => void;
  saveRoutine: (dateKey: string, items: RoutineItem[]) => void;
  resetRoutine: (dateKey: string) => void;
  stretchOverrides: StretchOverrides;
  setStretchOverride: (slot: 'stretch1' | 'stretch2', value: VideoRef | null | undefined) => void;
  learnDuration: (videoId: string, seconds: number) => void;
  resetRecords: () => void;
  resetEverything: () => void;
  exportBackup: () => BackupFile;
  importBackup: (data: unknown) => boolean;
  imported: ImportedMonths;
  saveImportedMonth: (month: string, days: Record<string, ScheduleDay>) => void;
  removeImportedMonth: (month: string) => void;
  videoNames: Record<string, string>;
  setVideoNames: (names: Record<string, string>) => void;
  /** dates of a month that were edited by hand (they keep priority over imports) */
  customDatesIn: (month: string) => string[];
  recurring: RecurringRule[];
  saveRecurring: (rule: RecurringRule) => void;
  /** Stops a weekly repeat from `fromDate` on (earlier days keep it; removed if it never started). */
  stopRecurring: (id: string, fromDate: string) => void;
  stretchDays: StretchDays;
  /** From `fromDate` on, run the default stretch only on these weekdays ([] = off). */
  setStretchDays: (slot: StretchSlot, fromDate: string, days: number[]) => void;
  options: AppOptions;
  setOption: <K extends keyof AppOptions>(key: K, value: AppOptions[K]) => void;
  lastBackupAt?: string;
  markBackedUp: () => void;
  /** first day the app was used — calendars and stats start here */
  appStart: string;
  /** last month that has a planned routine (schedule file or Jiny import), at least this month */
  lastPlannedMonth: string;
  todos: TodoMap;
  /** one-off to-do for a date (lands at the top); returns its id */
  addTodo: (dateKey: string, title: string) => string;
  renameTodo: (dateKey: string, id: string, title: string) => void;
  removeTodo: (dateKey: string, id: string) => void;
  /** moves one-off to-dos to another date (unfinished ones from yesterday → today) */
  moveTodos: (fromDate: string, toDate: string, ids: string[]) => void;
  /** saves the order of a day's items (also becomes the order for other days) */
  setDayOrder: (ids: string[]) => void;
  /** 파란색 기록 settings (mode is 'ask' again if the linked to-do is gone) */
  highlight: HighlightSettings;
  setHighlight: (next: HighlightSettings) => void;
  /** set once when a linked to-do stopped and the mode fell back to 'ask' */
  highlightNotice: string | null;
  clearHighlightNotice: () => void;
}

const StoreContext = createContext<Store | null>(null);

const EMPTY_PREFS: Prefs = { stretches: {} };

function isRecordEmpty(rec: DayRecord): boolean {
  return Object.keys(rec.done).length === 0 && rec.strength === undefined;
}

export function WorkoutStoreProvider({ children }: { children: ReactNode }) {
  const { todayKey, now } = useToday();
  const [records, setRecords] = useState<RecordMap>(() => readJSON(STORAGE_KEYS.records, {}));
  const [routines, setRoutines] = useState<Record<string, RoutineItem[]>>(() => readJSON(STORAGE_KEYS.routines, {}));
  const [prefs, setPrefs] = useState<Prefs>(() => ({ ...EMPTY_PREFS, ...readJSON(STORAGE_KEYS.prefs, EMPTY_PREFS) }));
  const [videoMeta, setVideoMeta] = useState<VideoMeta>(() => readJSON(STORAGE_KEYS.videoMeta, {}));
  const options: AppOptions = useMemo(
    () => ({
      countPartialDays: prefs.options?.countPartialDays ?? appConfig.streak.countPartialDays,
      weekStartsOn: prefs.options?.weekStartsOn ?? appConfig.weekStartsOn,
    }),
    [prefs.options],
  );
  const [imported, setImported] = useState<ImportedMonths>(() => readJSON(STORAGE_KEYS.imported, {}));
  const [recurring, setRecurring] = useState<RecurringRule[]>(() => {
    const raw = readJSON<unknown>(STORAGE_KEYS.recurring, []);
    return Array.isArray(raw) ? (raw as RecurringRule[]) : [];
  });
  const [todos, setTodos] = useState<TodoMap>(() => readJSON(STORAGE_KEYS.todos, {}));

  useEffect(() => void writeJSON(STORAGE_KEYS.records, records), [records]);
  useEffect(() => void writeJSON(STORAGE_KEYS.routines, routines), [routines]);
  useEffect(() => void writeJSON(STORAGE_KEYS.prefs, prefs), [prefs]);
  useEffect(() => void writeJSON(STORAGE_KEYS.videoMeta, videoMeta), [videoMeta]);
  useEffect(() => void writeJSON(STORAGE_KEYS.imported, imported), [imported]);
  useEffect(() => void writeJSON(STORAGE_KEYS.recurring, recurring), [recurring]);
  useEffect(() => void writeJSON(STORAGE_KEYS.todos, todos), [todos]);

  // Keep several open tabs/windows in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.records) setRecords(readJSON(STORAGE_KEYS.records, {}));
      if (e.key === STORAGE_KEYS.routines) setRoutines(readJSON(STORAGE_KEYS.routines, {}));
      if (e.key === STORAGE_KEYS.prefs) setPrefs({ ...EMPTY_PREFS, ...readJSON(STORAGE_KEYS.prefs, EMPTY_PREFS) });
      if (e.key === STORAGE_KEYS.imported) setImported(readJSON(STORAGE_KEYS.imported, {}));
      if (e.key === STORAGE_KEYS.todos) setTodos(readJSON(STORAGE_KEYS.todos, {}));
      if (e.key === STORAGE_KEYS.recurring) {
        const raw = readJSON<unknown>(STORAGE_KEYS.recurring, []);
        setRecurring(Array.isArray(raw) ? (raw as RecurringRule[]) : []);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const learnedDurations = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [id, meta] of Object.entries(videoMeta)) if (meta.durationSec) out[id] = meta.durationSec;
    return out;
  }, [videoMeta]);

  // Imported Jiny months sit on top of the schedule file (hand edits still win).
  // Remember the first day the app was used (or the earliest record, if older).
  const firstRecord = useMemo(() => earliestRecordKey(records), [records]);
  const appStart = [prefs.startedOn ?? todayKey, firstRecord ?? todayKey].sort()[0];
  useEffect(() => {
    if (prefs.startedOn !== appStart) setPrefs((prev) => ({ ...prev, startedOn: appStart }));
  }, [appStart, prefs.startedOn]);

  const schedule = useMemo(() => {
    const merged = { ...workoutSchedule };
    for (const month of Object.values(imported)) Object.assign(merged, month.days);
    return merged;
  }, [imported]);

  const lastPlannedMonth = useMemo(() => {
    const keys = Object.keys(schedule).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k));
    const last = keys.length ? keys.sort()[keys.length - 1].slice(0, 7) : '';
    const current = todayKey.slice(0, 7);
    return last > current ? last : current;
  }, [schedule, todayKey]);

  const resolveCtx: ResolveContext = useMemo(
    () => ({
      schedule,
      customRoutines: routines,
      stretches: mergeStretchDefaults(prefs.stretches),
      learnedDurations,
      recurring,
      stretchDays: prefs.stretchDays,
      todos,
      order: prefs.itemOrder,
    }),
    [schedule, routines, prefs.stretches, prefs.stretchDays, learnedDurations, recurring, todos, prefs.itemOrder],
  );

  const highlight = useMemo(() => ({ ...DEFAULT_HIGHLIGHT, ...prefs.highlight }), [prefs.highlight]);
  const highlightRule = useMemo(
    () => ({
      off: highlight.mode === 'off',
      itemIds: [highlight.ruleId, ...(highlight.pastRuleIds ?? [])].filter((id): id is string => !!id).map(recurringItemId),
    }),
    [highlight],
  );

  // The linked to-do was deleted or stopped → keep its old checks, go back to asking.
  const [highlightNotice, setHighlightNotice] = useState<string | null>(null);
  useEffect(() => {
    if (highlight.mode !== 'todo') return;
    const rule = recurring.find((r) => r.id === highlight.ruleId);
    if (rule && (!rule.endDate || rule.endDate >= todayKey)) return;
    setPrefs((prev) => {
      const h = { ...DEFAULT_HIGHLIGHT, ...prev.highlight };
      const past = h.ruleId ? [...new Set([...(h.pastRuleIds ?? []), h.ruleId])] : h.pastRuleIds;
      return { ...prev, highlight: { ...h, mode: 'ask', ruleId: undefined, pastRuleIds: past } };
    });
    setHighlightNotice(`연결한 할 일이 없어져서 '${highlight.name}' 기록을 직접 답하기로 바꿨어요`);
  }, [highlight.mode, highlight.ruleId, highlight.name, recurring, todayKey]);

  const getPlan = useCallback((dateKey: string) => resolveDay(dateKey, resolveCtx), [resolveCtx]);
  const getProgress = useCallback(
    (dateKey: string) => dayProgress(getPlan(dateKey), records[dateKey], todayKey, highlightRule),
    [getPlan, records, todayKey, highlightRule],
  );

  const streak = useMemo(() => {
    const earliest = earliestRecordKey(records);
    return {
      current: currentStreak(getProgress, todayKey, earliest, options.countPartialDays),
      longest: longestStreak(getProgress, todayKey, earliest, options.countPartialDays),
    };
  }, [getProgress, records, todayKey, options.countPartialDays]);

  const setItemDone = useCallback(
    (dateKey: string, itemId: string, done: boolean) => {
      const plan = resolveDay(dateKey, resolveCtx);
      setRecords((prev) => {
        const stamp = new Date().toISOString();
        const rec: DayRecord = prev[dateKey] ?? { done: {}, updatedAt: stamp };
        const doneMap = { ...rec.done };
        if (done) doneMap[itemId] = doneMap[itemId] ?? stamp;
        else delete doneMap[itemId];
        const allDone = plan.items.length > 0 && plan.items.every((item) => doneMap[item.id]);
        const next: DayRecord = {
          ...rec,
          done: doneMap,
          finishedAt: allDone ? (rec.finishedAt ?? stamp) : undefined,
          updatedAt: stamp,
        };
        const copy = { ...prev };
        if (isRecordEmpty(next)) delete copy[dateKey];
        else copy[dateKey] = next;
        return copy;
      });
    },
    [resolveCtx],
  );

  const setStrength = useCallback((dateKey: string, value: boolean | undefined) => {
    setRecords((prev) => {
      const stamp = new Date().toISOString();
      const rec: DayRecord = prev[dateKey] ?? { done: {}, updatedAt: stamp };
      const next: DayRecord = { ...rec, strength: value, updatedAt: stamp };
      const copy = { ...prev };
      if (isRecordEmpty(next)) delete copy[dateKey];
      else copy[dateKey] = next;
      return copy;
    });
  }, []);

  const saveRoutine = useCallback((dateKey: string, items: RoutineItem[]) => {
    setRoutines((prev) => ({ ...prev, [dateKey]: items }));
  }, []);

  const resetRoutine = useCallback((dateKey: string) => {
    setRoutines((prev) => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
  }, []);

  const setStretchOverride = useCallback((slot: 'stretch1' | 'stretch2', value: VideoRef | null | undefined) => {
    setPrefs((prev) => {
      const stretches = { ...prev.stretches };
      if (value === undefined) delete stretches[slot];
      else stretches[slot] = value;
      return { ...prev, stretches };
    });
  }, []);

  const learnDuration = useCallback((videoId: string, seconds: number) => {
    if (!videoId || !Number.isFinite(seconds) || seconds <= 0) return;
    setVideoMeta((prev) =>
      prev[videoId]?.durationSec === Math.round(seconds)
        ? prev
        : { ...prev, [videoId]: { ...prev[videoId], durationSec: Math.round(seconds) } },
    );
  }, []);

  // The hidden duration probe reports lengths straight into the store.
  useEffect(() => setDurationListener(learnDuration), [learnDuration]);

  const resetRecords = useCallback(() => {
    removeKey(STORAGE_KEYS.records);
    setRecords({});
  }, []);

  const resetEverything = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(removeKey);
    setRecords({});
    setRoutines({});
    setPrefs(EMPTY_PREFS);
    setVideoMeta({});
    setImported({});
    setRecurring([]);
    setTodos({});
  }, []);

  const saveRecurring = useCallback((rule: RecurringRule) => {
    setRecurring((prev) => {
      const i = prev.findIndex((r) => r.id === rule.id);
      if (i < 0) return [...prev, rule];
      const copy = [...prev];
      copy[i] = rule;
      return copy;
    });
  }, []);

  const setStretchDays = useCallback((slot: StretchSlot, fromDate: string, days: number[]) => {
    setPrefs((prev) => {
      const versions = (prev.stretchDays?.[slot] ?? []).filter((v) => v.from < fromDate);
      return {
        ...prev,
        stretchDays: { ...prev.stretchDays, [slot]: [...versions, { from: fromDate, days: [...days].sort((a, b) => a - b) }] },
      };
    });
  }, []);

  const stopRecurring = useCallback((id: string, fromDate: string) => {
    setRecurring((prev) =>
      prev.flatMap((r) => {
        if (r.id !== id) return [r];
        const endDate = addDays(fromDate, -1);
        return endDate < r.startDate ? [] : [{ ...r, endDate }];
      }),
    );
  }, []);

  const saveImportedMonth = useCallback((month: string, days: Record<string, ScheduleDay>) => {
    setImported((prev) => ({ ...prev, [month]: { importedAt: new Date().toISOString(), source: 'jinydiet', days } }));
  }, []);

  const removeImportedMonth = useCallback((month: string) => {
    setImported((prev) => {
      const copy = { ...prev };
      delete copy[month];
      return copy;
    });
  }, []);

  const setVideoNames = useCallback((names: Record<string, string>) => {
    setPrefs((prev) => ({ ...prev, videoNames: { ...prev.videoNames, ...names } }));
  }, []);

  const customDatesIn = useCallback(
    (month: string) => Object.keys(routines).filter((key) => key.startsWith(month + '-')),
    [routines],
  );

  const addTodo = useCallback((dateKey: string, title: string) => {
    const id = `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setTodos((prev) => ({ ...prev, [dateKey]: [...(prev[dateKey] ?? []), { id, title, createdAt: new Date().toISOString() }] }));
    return id;
  }, []);

  const renameTodo = useCallback((dateKey: string, id: string, title: string) => {
    setTodos((prev) => ({ ...prev, [dateKey]: (prev[dateKey] ?? []).map((t) => (t.id === id ? { ...t, title } : t)) }));
  }, []);

  /** forget a finished mark of an item that no longer exists on that day */
  const clearDone = useCallback((dateKey: string, itemId: string) => {
    setRecords((prev) => {
      const rec = prev[dateKey];
      if (!rec?.done[itemId]) return prev;
      const done = { ...rec.done };
      delete done[itemId];
      const next = { ...rec, done, updatedAt: new Date().toISOString() };
      const copy = { ...prev };
      if (isRecordEmpty(next)) delete copy[dateKey];
      else copy[dateKey] = next;
      return copy;
    });
  }, []);

  const removeTodo = useCallback(
    (dateKey: string, id: string) => {
      setTodos((prev) => {
        const list = (prev[dateKey] ?? []).filter((t) => t.id !== id);
        const copy = { ...prev };
        if (list.length) copy[dateKey] = list;
        else delete copy[dateKey];
        return copy;
      });
      clearDone(dateKey, id);
      setPrefs((prev) => (prev.itemOrder?.includes(id) ? { ...prev, itemOrder: prev.itemOrder.filter((x) => x !== id) } : prev));
    },
    [clearDone],
  );

  const moveTodos = useCallback((fromDate: string, toDate: string, ids: string[]) => {
    const moving = new Set(ids);
    setTodos((prev) => {
      const from = prev[fromDate] ?? [];
      // carried-over to-dos count as new: they land on top of the day
      const now = new Date().toISOString();
      const picked = from.filter((t) => moving.has(t.id)).map((t) => ({ ...t, createdAt: now }));
      if (!picked.length) return prev;
      const copy = { ...prev, [toDate]: [...(prev[toDate] ?? []), ...picked] };
      const rest = from.filter((t) => !moving.has(t.id));
      if (rest.length) copy[fromDate] = rest;
      else delete copy[fromDate];
      return copy;
    });
  }, []);

  const setHighlight = useCallback((next: HighlightSettings) => {
    setPrefs((prev) => ({ ...prev, highlight: next }));
  }, []);

  const setDayOrder = useCallback((ids: string[]) => {
    setPrefs((prev) => ({ ...prev, itemOrder: mergeOrder(prev.itemOrder ?? [], ids) }));
  }, []);

  const markBackedUp = useCallback(() => {
    setPrefs((prev) => ({ ...prev, lastBackupAt: new Date().toISOString() }));
  }, []);

  const setOption = useCallback(<K extends keyof AppOptions>(key: K, value: AppOptions[K]) => {
    setPrefs((prev) => ({ ...prev, options: { ...prev.options, [key]: value } }));
  }, []);

  const exportBackup = useCallback(
    (): BackupFile => ({
      app: 'daily-fit',
      version: 1,
      exportedAt: new Date().toISOString(),
      records,
      routines,
      prefs,
      imported,
      recurring,
      todos,
    }),
    [records, routines, prefs, imported, recurring, todos],
  );

  const importBackup = useCallback((data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false;
    const file = data as Partial<BackupFile>;
    if (file.app !== 'daily-fit' || typeof file.records !== 'object' || !file.records) return false;
    setRecords(file.records);
    setRoutines(file.routines && typeof file.routines === 'object' ? file.routines : {});
    setPrefs({ ...EMPTY_PREFS, ...(file.prefs ?? {}) });
    setImported(file.imported && typeof file.imported === 'object' ? file.imported : {});
    setRecurring(Array.isArray(file.recurring) ? file.recurring : []);
    setTodos(file.todos && typeof file.todos === 'object' ? file.todos : {});
    return true;
  }, []);

  const value: Store = {
    todayKey,
    now,
    records,
    getPlan,
    getProgress,
    streak,
    setItemDone,
    setStrength,
    saveRoutine,
    resetRoutine,
    stretchOverrides: prefs.stretches,
    setStretchOverride,
    learnDuration,
    resetRecords,
    resetEverything,
    exportBackup,
    importBackup,
    imported,
    saveImportedMonth,
    removeImportedMonth,
    videoNames: prefs.videoNames ?? {},
    setVideoNames,
    customDatesIn,
    recurring,
    saveRecurring,
    stopRecurring,
    stretchDays: prefs.stretchDays ?? {},
    setStretchDays,
    options,
    setOption,
    lastBackupAt: prefs.lastBackupAt,
    appStart,
    lastPlannedMonth,
    markBackedUp,
    todos,
    addTodo,
    renameTodo,
    removeTodo,
    moveTodos,
    setDayOrder,
    highlight,
    setHighlight,
    highlightNotice,
    clearHighlightNotice: () => setHighlightNotice(null),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <WorkoutStoreProvider>');
  return store;
}
