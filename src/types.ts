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

/** A resolved, playable item of a day. */
export interface RoutineItem {
  id: string;
  type: WorkoutType;
  title: string;
  youtubeUrl: string;
  durationMin?: number;
  category?: string;
  /** Set when the item comes from a weekly repeat rule */
  recurringId?: string;
  /** Exact played length in seconds when it was measured (keeps totals precise) */
  durationSec?: number;
}

/** "Every week on these weekdays" video, added on top of each matching day's plan. */
export interface RecurringRule {
  id: string;
  type: WorkoutType;
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
  /** Answer to "Did you do strength training today?" */
  strength?: boolean;
  /** Set when every item of the day was completed */
  finishedAt?: string;
  updatedAt: string;
}

export type RecordMap = Record<string, DayRecord>;

export type DayStatus = 'future' | 'rest' | 'none' | 'partial' | 'full';

export interface DayProgress {
  total: number;
  completed: number;
  ratio: number;
  status: DayStatus;
  strength: boolean;
  minutes: number;
}
