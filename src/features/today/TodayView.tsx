import { ArrowDownToLine, CalendarPlus, Check, Pencil, Play, Plus, Settings, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StreakBadge } from '../../components/StreakBadge';
import { Tip } from '../../components/Tip';
import { formatParts } from '../../lib/date';
import { addDays } from '../../lib/date';
import { probeDurations } from '../../lib/durationProbe';
import { useTip } from '../../lib/onboarding';
import { durationSummary, isTodo, isVideo } from '../../lib/schedule';
import { parseYouTubeId } from '../../lib/youtube';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import type { RoutineItem } from '../../types';
import { TodoCard } from '../todo/TodoCard';
import { TodoSheet, type TodoTarget } from '../todo/TodoSheet';
import { StartSheet } from './StartSheet';
import { TodayHero } from './TodayHero';
import { WeekStrip } from './WeekStrip';
import { useLongPressReorder } from './useLongPressReorder';
import { WorkoutCard } from './WorkoutCard';
import './today.css';

interface TodayViewProps {
  onStartSession: (items: RoutineItem[]) => void;
  onOpenSettings: () => void;
  onOpenDay: (dateKey: string) => void;
  onEditRoutine: (dateKey: string) => void;
}

export function TodayView({ onStartSession, onOpenSettings, onOpenDay, onEditRoutine }: TodayViewProps) {
  const { todayKey, getPlan, getProgress, records, setItemDone, streak, todos, moveTodos, setDayOrder } = useStore();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [undoTarget, setUndoTarget] = useState<RoutineItem | null>(null);
  const [todoTarget, setTodoTarget] = useState<TodoTarget>(null);
  const [checkTipOpen] = useTip('today-check');

  const plan = getPlan(todayKey);
  const progress = getProgress(todayKey);
  const record = records[todayKey];
  const doneIds = useMemo(() => new Set(Object.keys(record?.done ?? {})), [record]);
  const parts = formatParts(todayKey);
  const duration = durationSummary(plan.items);
  const videos = plan.items.filter(isVideo);
  const todoCount = plan.items.length - videos.length;
  const videosLeft = videos.filter((i) => !doneIds.has(i.id)).length;
  const videosDone = videos.length > 0 && videosLeft === 0;
  const sort = useLongPressReorder(
    plan.items.map((i) => i.id),
    setDayOrder,
  );

  // yesterday's unfinished one-off to-dos can be carried over
  const yesterday = addDays(todayKey, -1);
  const leftover = (todos[yesterday] ?? []).filter((t) => !records[yesterday]?.done[t.id]);

  // Measure unknown video lengths (today first, then tomorrow) so the total is right before starting.
  const tomorrow = getPlan(addDays(todayKey, 1));
  const unknownIds = [...plan.items, ...tomorrow.items]
    .filter((i) => !i.durationMin)
    .map((i) => parseYouTubeId(i.youtubeUrl))
    .filter((id): id is string => !!id)
    .join(',');
  useEffect(() => {
    if (unknownIds) probeDurations(unknownIds.split(','));
  }, [unknownIds]);
  const allDone = progress.total > 0 && progress.completed === progress.total;

  const toggle = (item: RoutineItem) => {
    if (doneIds.has(item.id)) {
      setUndoTarget(item); // un-marking asks first (prevents accidental taps)
      return;
    }
    setItemDone(todayKey, item.id, true);
    toast({
      message: `‘${item.title}’ 완료`,
      actionLabel: '되돌리기',
      onAction: () => setItemDone(todayKey, item.id, false),
    });
  };

  // the start button is about the videos; to-dos are checked off in the list
  let ctaLabel = '운동 시작';
  if (plan.isRest) ctaLabel = '스트레칭 시작';
  if (videosLeft < videos.length && !videosDone) ctaLabel = '이어서 운동하기';
  if (videosDone) ctaLabel = '한 번 더 하기';
  const todosLeft = plan.items.filter((i) => isTodo(i) && !doneIds.has(i.id)).length;

  return (
    <div className="today screen">
      <div className="today__aside">
      <header className="today-head">
        <div className="today-date">
          <h1 className="today-date__main" aria-label={parts.label}>
            <span className="num">{parts.month}</span>
            <span className="today-date__unit">월</span>
            <span className="num today-date__day">{parts.day}</span>
            <span className="today-date__unit">일</span>
          </h1>
          <div className="today-date__weekday">{parts.weekday}</div>
        </div>
        <div className="today-head__actions">
          <StreakBadge days={streak.current} variant="compact" />
          <IconButton label="설정" onClick={onOpenSettings}>
            <Settings size={20} strokeWidth={2.2} />
          </IconButton>
        </div>
      </header>

      <WeekStrip todayKey={todayKey} onSelect={onOpenDay} />

      <TodayHero plan={plan} progress={progress} doneIds={doneIds} />
      {videos.length > 0 && (
        <div className="start-bar">
          <button
            type="button"
            className={`start-btn${videosDone ? ' is-done' : ''}`}
            onClick={() => setPickerOpen(true)}
          >
            <span className="start-btn__icon" aria-hidden="true">
              {videosDone ? <Check size={22} strokeWidth={3} /> : <Play size={20} strokeWidth={0} fill="currentColor" />}
            </span>
            <span className="start-btn__text">
              <span className="start-btn__label">{ctaLabel}</span>
              <span className="start-btn__sub">
                {videosDone
                  ? todosLeft
                    ? `영상은 모두 끝! 남은 할 일 ${todosLeft}개`
                    : allDone
                      ? '오늘 루틴을 모두 완료했어요'
                      : '오늘 영상을 모두 완료했어요'
                  : `남은 영상 ${videosLeft}/${videos.length}${duration.label ? ` · 총 ${duration.label}` : ''}`}
              </span>
            </span>
          </button>
        </div>
      )}
      </div>

      <div className="today__main">
      <div className="section-head">
        <div>
          <h2 className="section-title">오늘의 루틴</h2>
          <div className="section-sub">
            영상 {videos.length}개{todoCount ? ` · 할 일 ${todoCount}개` : ''}
            {duration.label ? ` · ${duration.label}` : ''}
            {plan.isCustom ? ' · 수정됨' : ''}
          </div>
        </div>
        <button type="button" className="text-link" onClick={() => onEditRoutine(todayKey)}>
          <Pencil size={15} strokeWidth={2.4} /> 편집
        </button>
      </div>

      <button type="button" className="todo-add" onClick={() => setTodoTarget({ dateKey: todayKey })}>
        <span className="todo-add__icon" aria-hidden="true">
          <Plus size={16} strokeWidth={2.8} />
        </span>
        할 일 추가
      </button>

      {leftover.length > 0 && (
        <div className="todo-carry">
          <span>
            어제 못 한 할 일 <strong className="num">{leftover.length}</strong>개
          </span>
          <button
            type="button"
            className="todo-carry__btn"
            onClick={() => {
              moveTodos(
                yesterday,
                todayKey,
                leftover.map((t) => t.id),
              );
              toast({ message: '어제 할 일을 오늘로 옮겼어요' });
            }}
          >
            <ArrowDownToLine size={15} strokeWidth={2.4} /> 오늘로 옮기기
          </button>
        </div>
      )}

      {plan.items.length === 0 ? (
        <div className="empty card">
          <div className="empty__icon">
            <CalendarPlus size={26} strokeWidth={2} />
          </div>
          <h3 className="empty__title">오늘은 계획된 영상이 없어요</h3>
          <p className="empty__text">운동이나 스트레칭 영상을 추가해서 오늘의 루틴을 만들어 보세요.</p>
          <Button variant="dark" onClick={() => onEditRoutine(todayKey)}>
            영상 추가하기
          </Button>
        </div>
      ) : (
        <div className={`wcard-list${sort.dragging ? ' is-sorting' : ''}`} ref={sort.listRef}>
          <Tip id="today-check">오른쪽 체크를 누르면 영상을 보지 않고도 완료로 표시돼요.</Tip>
          {!checkTipOpen && plan.items.length > 1 && (
            <Tip id="today-reorder">카드를 꾹 길게 누르면 위아래로 순서를 바꿀 수 있어요.</Tip>
          )}
          {plan.items.map((item, index) => (
            <div
              key={item.id}
              className={`sort-item${sort.dragging === item.id ? ' is-lifted' : ''}`}
              style={sort.styleFor(index)}
              {...sort.bind(item.id, index)}
            >
              {isTodo(item) ? (
                <TodoCard
                  item={item}
                  index={index}
                  done={doneIds.has(item.id)}
                  onEdit={() => setTodoTarget({ dateKey: todayKey, item })}
                  onToggleDone={() => toggle(item)}
                />
              ) : (
                <WorkoutCard
                  item={item}
                  index={index}
                  done={doneIds.has(item.id)}
                  onPlay={() => onStartSession([item])}
                  onToggleDone={() => toggle(item)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      </div>

      <StartSheet
        open={pickerOpen}
        items={videos}
        doneIds={doneIds}
        onClose={() => setPickerOpen(false)}
        onStart={(items) => {
          setPickerOpen(false);
          onStartSession(items);
        }}
      />

      <TodoSheet target={todoTarget} onClose={() => setTodoTarget(null)} />

      <ConfirmDialog
        open={undoTarget !== null}
        icon={<Undo2 size={24} strokeWidth={2.2} />}
        title="완료를 취소할까요?"
        message={undoTarget ? `‘${undoTarget.title}’의 오늘 완료 표시가 해제돼요.` : undefined}
        confirmLabel="완료 취소"
        onCancel={() => setUndoTarget(null)}
        onConfirm={() => {
          if (undoTarget) setItemDone(todayKey, undoTarget.id, false);
          setUndoTarget(null);
        }}
      />
    </div>
  );
}
