import type { WorkoutSchedule } from '../types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  운동 일정 (월간 프로그램) — 날짜('YYYY-MM-DD')마다 하나씩
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  ⚠️  더미 데이터(DUMMY DATA): 아래 영상은 앱이 바로 동작하도록 넣어둔 공개 샘플이에요.
 *      실제 프로그램의 title / youtubeUrl 로 바꿔서 사용하세요.
 *
 *  매일 재생 순서:   스트레칭 1 → 운동 1(workout1) → 운동 2(workout2) → 스트레칭 2
 *
 *  '2026-10-13': {
 *    workout1: { title: '하체 불태우기', youtubeUrl: 'https://youtu.be/VIDEO_ID', durationMin: 12, category: '지니다이어트' },
 *    workout2: { title: '코어 운동',     youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID' },
 *    // 선택 — src/config/appConfig.ts 의 기본 스트레칭 대신 이 날만 다른 스트레칭:
 *    // stretch1: { title: '고관절 스트레칭', youtubeUrl: '...' },
 *    // stretch2: null,              // ← 이 날은 마무리 스트레칭 없음
 *  },
 *  '2026-10-18': { rest: true },   // (예시) 휴식일로 지정하는 방법 — 연속 기록이 끊기지 않아요
 *
 *  - youtubeUrl: watch?v=, youtu.be/, shorts/, embed/, live/ 링크 모두 가능
 *  - durationMin(분), category(라벨)는 선택. 시간을 비워두면 처음 재생할 때 자동으로 기록돼요.
 *  - 여기에 없는 날짜는 기본 스트레칭만 표시돼요.
 *  - 앱에서 '루틴 편집'으로 바꾼 날은 이 파일보다 우선해요. 편집 화면의 '초기화'를 누르면 이 파일 내용으로 돌아와요.
 */
export const workoutSchedule: WorkoutSchedule = {
  // ───────────── October 2026 ─────────────
  '2026-10-01': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-02': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-03': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-04': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-10-05': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-06': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-07': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-08': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-09': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-10': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-11': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-10-12': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-13': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-14': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-15': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-16': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-17': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-18': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-10-19': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-20': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-21': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-22': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-23': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-24': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-25': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-10-26': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-27': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-10-28': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-29': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-10-30': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-10-31': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },

  // ───────────── November 2026 ─────────────
  '2026-11-01': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-11-02': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-03': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-04': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-05': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-06': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-07': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-08': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-11-09': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-10': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-11': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-12': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-13': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-14': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-15': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-11-16': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-17': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-18': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-19': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-20': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-21': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-22': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-11-23': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-24': {
    workout1: { title: "15 Min Beginner Full Body", youtubeUrl: 'https://www.youtube.com/watch?v=xCSaHRtgw1w', durationMin: 16, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-25': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-26': {
    workout1: { title: "10 Min Leg, Booty & Thigh Workout", youtubeUrl: 'https://www.youtube.com/watch?v=FJA3R7n_594', durationMin: 12, category: "MadFit" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
  '2026-11-27': {
    workout1: { title: "10 Min Upper Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=DHOPWvO3ZcI', durationMin: 11, category: "Pamela Reif" },
    workout2: { title: "12 Min Standing Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=1r0i6hTErdw', durationMin: 14, category: "BodyFit By Amy" },
  },
  '2026-11-28': {
    workout1: { title: "15 Min Full Body Workout", youtubeUrl: 'https://www.youtube.com/watch?v=9PCGvkXV-Bo', durationMin: 17, category: "MadFit" },
    workout2: { title: "10 Min Daily Abs", youtubeUrl: 'https://www.youtube.com/watch?v=Dl8N_8UtWUU', durationMin: 11, category: "MadFit" },
  },
  '2026-11-29': {
    workout1: { title: "10 Min Pilates Legs", youtubeUrl: 'https://www.youtube.com/watch?v=gUvF76gAL4c', durationMin: 10, category: "nikola's pilates" },
    workout2: { title: "Tone Your Arms Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AsPPDOsCH4A', durationMin: 12, category: "MadFit" },
  },
  '2026-11-30': {
    workout1: { title: "12 Min Tabata HIIT Cardio", youtubeUrl: 'https://www.youtube.com/watch?v=VRGNQQLzNtI', durationMin: 12, category: "growingannanas" },
    workout2: { title: "10 Min Ab Workout", youtubeUrl: 'https://www.youtube.com/watch?v=AnYl6Nk9GOA', durationMin: 10, category: "Pamela Reif" },
  },
};
