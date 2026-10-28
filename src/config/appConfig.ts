import type { VideoRef } from '../types';

/**
 * 앱 전체 설정. UI 컴포넌트에는 하드코딩된 값이 없으니 여기서 자유롭게 바꾸세요.
 *
 * 스트레칭 영상
 * -------------
 * `defaultStretchVideo`  → 매일 스트레칭 1(준비운동)에 사용
 * `defaultStretch2Video` → 매일 스트레칭 2(마무리)에 사용. `null` 로 두면 둘 다 defaultStretchVideo 사용.
 * 특정 날만 바꾸려면 src/data/workoutSchedule.ts 에서 그 날짜에 `stretch1` / `stretch2` 를 지정하세요.
 * 앱 안의 설정 → 기본 스트레칭 에서도 바꿀 수 있어요 (그 값이 이 파일보다 우선).
 */

// 스트레칭 1 (준비운동) — 시간은 처음 재생할 때 자동으로 기록돼요.
const defaultStretchVideo: VideoRef = {
  title: '골반교정 · 체형교정 스트레칭',
  youtubeUrl: 'https://www.youtube.com/watch?v=nQlbDogfCpE',
  category: 'SomiFit',
};

// 스트레칭 2 (마무리) — 링크의 t=130s 부터 재생돼요.
const defaultStretch2Video: VideoRef | null = {
  title: '전신 노폐물 빼는 폼롤러 마사지',
  youtubeUrl: 'https://www.youtube.com/watch?v=CXL0RgtXoJE&t=130s',
  category: '지니다이어트',
};

export const appConfig = {
  appName: '모루',

  defaultStretchVideo,
  defaultStretch2Video,

  /** Label shown when a workout has no `category`. */
  defaultWorkoutCategory: '홈트레이닝',
  defaultStretchCategory: '스트레칭',

  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 as 0 | 1,

  streak: {
    /** true: a day with at least one finished video keeps the streak alive.
     *  false: only fully completed days count. Rest days never break a streak. */
    countPartialDays: true,
  },
} as const;
