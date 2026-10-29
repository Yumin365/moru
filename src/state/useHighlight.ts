import { highlightDayLabel, highlightQuestion } from '../lib/highlight';
import { useStore } from './WorkoutStore';

/** The 파란색 기록 as the screens show it: name, icon, wording, and how it's recorded. */
export function useHighlight() {
  const { highlight } = useStore();
  return {
    ...highlight,
    on: highlight.mode !== 'off',
    /** "명상한 날" */
    dayLabel: highlightDayLabel(highlight.name),
    /** "오늘 명상을 했나요?" */
    question: highlightQuestion(highlight.name),
  };
}
