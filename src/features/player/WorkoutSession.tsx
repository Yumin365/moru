import { Check, ChevronLeft, Maximize2, SkipForward, TriangleAlert, WifiOff, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { YouTubeIcon } from '../../components/PlatformIcons';
import { Thumbnail } from '../../components/Thumbnail';
import { exitFullscreen } from '../../lib/fullscreen';
import { useTip } from '../../lib/onboarding';
import { itemCategory } from '../../lib/schedule';
import { parseStartSeconds, parseYouTubeId, watchUrl } from '../../lib/youtube';
import { useBackButton } from '../../state/useBackButton';
import { useToast } from '../../state/Toast';
import { useStore } from '../../state/WorkoutStore';
import type { RoutineItem } from '../../types';
import { CompletionScreen } from '../completion/CompletionScreen';
import { SegmentedProgress } from './SegmentedProgress';
import { useWakeLock } from './useWakeLock';
import { useYouTubePlayer } from './useYouTubePlayer';
import './player.css';

interface WorkoutSessionProps {
  dateKey: string;
  items: RoutineItem[];
  onExit: () => void;
}

/** Hide the controls again after this long without touching them (while a video plays). */
const CONTROLS_AUTO_HIDE_MS = 8000;

/**
 * Full-screen session: player → next → … → completion screen.
 * The video fills the screen; one tap shows the controls panel (right side in
 * landscape, below the video in portrait). When a video ends the next one starts
 * immediately.
 */
export function WorkoutSession({ dateKey, items, onExit }: WorkoutSessionProps) {
  const { records, setItemDone, getProgress, learnDuration } = useStore();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'complete'>('playing');
  const [confirmExit, setConfirmExit] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [tapTip, dismissTapTip] = useTip('player');
  const [showTapHint, setShowTapHint] = useState(tapTip);

  useWakeLock(phase === 'playing');
  useBackButton(true, onExit);
  useEffect(() => () => exitFullscreen(), []);
  useEffect(() => {
    if (!showTapHint) return;
    dismissTapTip();
    const t = window.setTimeout(() => setShowTapHint(false), 6000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doneIds = useMemo(() => new Set(Object.keys(records[dateKey]?.done ?? {})), [records, dateKey]);
  const current = items[index];
  const next = items[index + 1];
  const isLast = index === items.length - 1;
  const videoId = parseYouTubeId(current?.youtubeUrl);
  const isDone = current ? doneIds.has(current.id) : false;

  const finish = useCallback(() => {
    const dayDone = getProgress(dateKey).status === 'full';
    // A single video played from its card: just return unless that finished the day.
    if (items.length === 1 && !dayDone) {
      if (doneIds.has(items[0].id)) toast({ message: `‘${items[0].title}’ 완료` });
      onExit();
      return;
    }
    setPhase('complete');
  }, [dateKey, doneIds, getProgress, items, onExit, toast]);

  const goTo = useCallback(
    (i: number) => {
      if (i >= items.length) finish();
      else setIndex(Math.max(0, i));
    },
    [items.length, finish],
  );

  const indexRef = useRef(index);
  indexRef.current = index;
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const handleEnded = useCallback(() => {
    const item = items[indexRef.current];
    if (!item) return;
    setItemDone(dateKey, item.id, true);
    if (indexRef.current >= items.length - 1) {
      // let the store update first, then finish with fresh state
      window.setTimeout(() => finishRef.current(), 350);
      return;
    }
    // Straight on to the next video, back in full-screen view.
    setShowControls(false);
    setIndex((i) => i + 1);
  }, [dateKey, items, setItemDone]);

  const player = useYouTubePlayer({
    videoId: phase === 'playing' ? videoId : null,
    startSeconds: parseStartSeconds(current?.youtubeUrl),
    onEnded: handleEnded,
    onDuration: (s) => videoId && learnDuration(videoId, s),
  });

  // The video needs a direct tap (autoplay blocked / error): keep the controls open and the video reachable.
  const needsInteraction = !videoId || player.status === 'error' || player.status === 'api-error' || player.autoplayBlocked;
  const controlsVisible = showControls || needsInteraction;

  // Auto-hide the controls while the video plays and nobody touches them.
  const [activity, setActivity] = useState(0);
  useEffect(() => {
    if (!controlsVisible || needsInteraction || player.status !== 'playing' || confirmExit) return;
    const t = window.setTimeout(() => setShowControls(false), CONTROLS_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [controlsVisible, needsInteraction, player.status, activity, confirmExit]);
  const bump = () => setActivity((a) => a + 1);

  const toggleDone = () => {
    if (!current) return;
    setItemDone(dateKey, current.id, !isDone);
  };

  const requestExit = () => {
    const remaining = items.some((i) => !doneIds.has(i.id));
    if (remaining) setConfirmExit(true);
    else onExit();
  };

  if (phase === 'complete') {
    return <CompletionScreen dateKey={dateKey} sessionItems={items} onDone={onExit} />;
  }

  if (!current) return null;

  const stepLabel = `${current.type === 'stretch' ? '스트레칭' : '운동'} · ${index + 1} / ${items.length}`;

  return (
    <div
      className={`session${controlsVisible ? ' has-controls' : ' is-immersive'}`}
      role="dialog"
      aria-modal="true"
      aria-label="운동 플레이어"
      onPointerDown={controlsVisible ? bump : undefined}
      onKeyDown={controlsVisible ? bump : undefined}
    >
      {!controlsVisible && (
        <button type="button" className="session__tap" onClick={() => setShowControls(true)} aria-label="운동 메뉴 보기">
          {showTapHint && <span className="session__tap-hint">화면을 한 번 누르면 목록·다음 버튼이 나와요</span>}
        </button>
      )}

      <header className="session__top">
        <IconButton label="운동 종료" variant="glass" onClick={requestExit}>
          <X size={20} strokeWidth={2.4} />
        </IconButton>
        <div className="session__step">
          <div className="session__step-label">재생 중</div>
          <div className="session__step-count num">{stepLabel}</div>
        </div>
        <div className="session__top-actions">
          <IconButton label="영상 크게 보기" variant="glass" onClick={() => setShowControls(false)} disabled={needsInteraction}>
            <Maximize2 size={18} strokeWidth={2.3} />
          </IconButton>
          {videoId && (
          <a
            className="icon-btn icon-btn--glass"
            style={{ width: 44, height: 44 }}
            href={watchUrl(videoId)}
            target="_blank"
            rel="noreferrer"
            aria-label="YouTube에서 열기"
            title="YouTube에서 열기"
          >
            <YouTubeIcon size={22} />
          </a>
          )}
        </div>
      </header>

      <div className="session__progress">
        <SegmentedProgress items={items} currentIndex={index} doneIds={doneIds} onSelect={goTo} />
      </div>

      <div className="session__layout">
        <div className="session__stage">
          <div className="video">
            <div ref={player.hostRef} className="video__host" />
            {!videoId && (
              <div className="video__overlay">
                <TriangleAlert size={28} />
                <p>올바른 YouTube 링크가 없는 항목이에요.</p>
                <Button variant="primary" size="sm" onClick={() => goTo(index + 1)}>
                  건너뛰기
                </Button>
              </div>
            )}
            {videoId && player.status === 'api-error' && (
              <div className="video__overlay">
                <WifiOff size={28} />
                <p>YouTube에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.</p>
                <a className="btn btn--primary btn--sm" href={watchUrl(videoId)} target="_blank" rel="noreferrer">
                  <span className="btn__icon">
                    <YouTubeIcon size={18} />
                  </span>
                  <span className="btn__label">YouTube에서 열기</span>
                </a>
              </div>
            )}
            {videoId && player.status === 'error' && (
              <div className="video__overlay">
                <TriangleAlert size={28} />
                <p>{player.errorText}</p>
                <div className="video__overlay-actions">
                  <a className="btn btn--soft btn--sm" href={watchUrl(videoId)} target="_blank" rel="noreferrer">
                    <span className="btn__icon">
                      <YouTubeIcon size={18} />
                    </span>
                    <span className="btn__label">YouTube에서 열기</span>
                  </a>
                  <Button variant="primary" size="sm" onClick={() => goTo(index + 1)}>
                    건너뛰기
                  </Button>
                </div>
              </div>
            )}
          </div>
          {player.autoplayBlocked && <p className="session__hint">영상을 탭하면 재생이 시작돼요.</p>}
        </div>

        <aside className="session__panel">
          <div className="now">
            <div className="now__chips">
              <span className={`chip${current.type === 'stretch' ? '' : ' chip--accent'}`}>
                {current.type === 'stretch' ? '스트레칭' : '운동'}
              </span>
              <span className="now__category">{itemCategory(current)}</span>
              {current.durationMin ? <span className="now__category num">· {current.durationMin}분</span> : null}
            </div>
            <h2 className="now__title">{current.title}</h2>
          </div>

          <div className="session__actions">
            <button
              type="button"
              className={`mark-btn${isDone ? ' is-done' : ''}`}
              onClick={toggleDone}
              aria-pressed={isDone}
            >
              <span className="mark-btn__check">
                <Check size={16} strokeWidth={3.2} />
              </span>
              {isDone ? '완료됨' : '완료로 표시'}
            </button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => (isLast ? finish() : goTo(index + 1))}
              trailingIcon={isLast ? <Check size={18} strokeWidth={3} /> : <SkipForward size={18} strokeWidth={2.4} />}
            >
              {isLast ? '운동 마치기' : '다음 운동'}
            </Button>
          </div>

          {index > 0 && (
            <button type="button" className="text-link text-link--light" onClick={() => goTo(index - 1)}>
              <ChevronLeft size={16} strokeWidth={2.4} /> 이전 영상
            </button>
          )}

          {next ? (
            <button type="button" className="upnext" onClick={() => goTo(index + 1)}>
              <Thumbnail url={next.youtubeUrl} type={next.type} className="upnext__thumb" />
              <span className="upnext__text">
                <span className="overline">다음 영상</span>
                <span className="upnext__title">{next.title}</span>
                <span className="upnext__meta">
                  {next.type === 'stretch' ? '스트레칭' : '운동'}
                  {next.durationMin ? ` · ${next.durationMin}분` : ''}
                </span>
              </span>
            </button>
          ) : (
            <div className="upnext upnext--last">
              <span className="upnext__text">
                <span className="overline">마지막 영상</span>
                <span className="upnext__title">끝까지 힘내요 💪</span>
              </span>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmExit}
        title="운동을 끝낼까요?"
        message="완료한 영상은 저장돼요. 오늘 화면에서 언제든 이어서 할 수 있어요."
        confirmLabel="끝내기"
        cancelLabel="계속하기"
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          onExit();
        }}
      />
    </div>
  );
}
