import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from './storage';

/**
 * First-run guide + one-time tips. Stored apart from the workout data (not in
 * backups): it only describes what this device's user has already seen.
 */
const KEY = 'dailyfit.onboarding.v1';

export type TipId = 'player' | 'calendar' | 'today-check';
const ALL_TIPS: TipId[] = ['player', 'calendar', 'today-check'];

interface OnboardingState {
  done: boolean;
  tips: Partial<Record<TipId, true>>;
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(): OnboardingState | null {
  const s = readJSON<OnboardingState | null>(KEY, null);
  return s && typeof s.done === 'boolean' ? { done: s.done, tips: s.tips ?? {} } : null;
}

function save(s: OnboardingState) {
  writeJSON(KEY, s);
  emit();
}

/**
 * Decides on first launch: someone who already has data is an existing user and
 * never sees the guide or the tips. Returns true when the guide should open.
 */
export function needsOnboarding(hasExistingData: boolean): boolean {
  const s = load();
  if (s) return !s.done;
  if (hasExistingData) {
    save({ done: true, tips: Object.fromEntries(ALL_TIPS.map((t) => [t, true])) });
    return false;
  }
  return true;
}

export function finishOnboarding() {
  save({ ...(load() ?? { tips: {} }), done: true });
}

/** 설정 › 사용법 다시 보기: shows the guide and every tip again. */
export function restartOnboarding() {
  save({ done: false, tips: {} });
}

export function dismissTip(id: TipId) {
  const s = load() ?? { done: true, tips: {} };
  save({ ...s, tips: { ...s.tips, [id]: true } });
}

/** Whether a tip should still show (only after the first-run guide is closed). */
export function useTip(id: TipId): [boolean, () => void] {
  const read = () => {
    const s = load();
    return !!s && s.done && !s.tips[id];
  };
  const [visible, setVisible] = useState(read);
  useEffect(() => {
    const update = () => setVisible(read());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return [visible, () => dismissTip(id)];
}
