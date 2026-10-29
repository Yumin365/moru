/** A YouTube video as written in the schedule / config files. */
export interface VideoRef {
  title: string;
  /** Any public YouTube link: watch?v=, youtu.be/, shorts/, embed/, live/ … */
  youtubeUrl: string;
  /** Length in minutes (optional — learned automatically from the player after first play). */
  durationMin?: number;
  /** Small label under the title, e.g. the channel or program name. */
  category?: string;
}

export type WorkoutType = 'workout' | 'stretch';

/** Routine items are videos (workout / stretch) or plain-text to-dos. */
export type ItemType = WorkoutType | 'todo';

/** The four fixed slots of a scheduled day, in session order. */
export type SlotId = 'stretch1' | 'workout1' | 'workout2' | 'stretch2';

/** One day in src/data/workoutSchedule.ts */
export interface ScheduleDay {
  workout1?: VideoRef;
  workout2?: VideoRef;
  /** Override the default stretch for this day only. `null` removes the stretch that day. */
  stretch1?: VideoRef | null;
  stretch2?: VideoRef | null;
  /** Rest day: no workouts (the daily stretches still show). */
  rest?: boolean;
  note?: string;
}

export type WorkoutSchedule = Record<string, ScheduleDay>;

/** A resolved item of a day: a playable video, or a to-do (empty youtubeUrl). */
export interface RoutineItem {
  id: string;
  type: ItemType;
  title: string;
  youtubeUrl: string;
  durationMin?: number;
  category?: string;
  /** Set when the item comes from a weekly repeat rule */
  recurringId?: string;
  /** Exact played length in seconds when it was measured (keeps totals precise) */
  durationSec?: number;
  /** One-off to-do this item comes from */
  todoId?: string;
}

/** A one-off to-do written for one date. */
export interface TodoEntry {
  id: string;
  title: string;
  createdAt: string;
}
/** dateKey → that day's one-off to-dos */
export type TodoMap = Record<string, TodoEntry[]>;

/** "Every week on these weekdays" video or to-do, added to each matching day's plan. */
export interface RecurringRule {
  id: string;
  type: ItemType;
  title: string;
  youtubeUrl: string;
  durationMin?: number;
  category?: string;
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  /** first date it applies to ('YYYY-MM-DD') */
  startDate: string;
  /** last date it applies to (set when the repeat is stopped) */
  endDate?: string;
  /** when it was made (newest to-dos go first) */
  createdAt?: string;
}

export interface DayPlan {
  dateKey: string;
  items: RoutineItem[];
  /** Explicit rest day in the schedule. */
  isRest: boolean;
  /** The date exists in the schedule file. */
  isScheduled: boolean;
  /** The user edited this day's routine in the app. */
  isCustom: boolean;
  note?: string;
}

/** What is stored per date in localStorage. */
export interface DayRecord {
  /** itemId → ISO timestamp of completion */
  done: Record<string, string>;
  /** Answer to the 파란색 기록 question ("Did you do strength training today?" by default) */
  strength?: boolean;
  /** Set when every item of the day was completed */
  finishedAt?: string;
  updatedAt: string;
}

export type RecordMap = Record<string, DayRecord>;

export type DayStatus = 'future' | 'rest' | 'none' | 'partial' | 'full';

export interface DayProgress {
  /** videos + to-dos */
  total: number;
  completed: number;
  /** how many of `completed` are to-dos */
  todosDone: number;
  /** how many of `total` are to-dos */
  todoTotal: number;
  ratio: number;
  status: DayStatus;
  strength: boolean;
  minutes: number;
}
