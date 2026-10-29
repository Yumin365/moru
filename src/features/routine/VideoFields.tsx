import { CircleCheck, ClipboardPaste, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { Thumbnail } from '../../components/Thumbnail';
import { fetchVideoTitle, parseYouTubeId } from '../../lib/youtube';
import type { ItemType } from '../../types';

export interface VideoDraft {
  title: string;
  youtubeUrl: string;
  durationMin?: number;
  category?: string;
}

interface VideoFieldsProps {
  value: VideoDraft;
  type: ItemType;
  onChange: (patch: Partial<VideoDraft>) => void;
  showErrors?: boolean;
}

/** Title / YouTube link / duration / label inputs with live link validation + thumbnail preview. */
export function VideoFields({ value, type, onChange, showErrors }: VideoFieldsProps) {
  const uid = useId();
  const videoId = parseYouTubeId(value.youtubeUrl);
  const hasUrl = value.youtubeUrl.trim().length > 0;
  const titleRef = useRef(value.title);
  titleRef.current = value.title;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  /** Title that belongs to the previous link (so it can be replaced when the link changes). */
  const staleTitle = useRef<string | null>(null);

  const changeUrl = (url: string) => {
    const nextId = parseYouTubeId(url);
    if (nextId && videoId && nextId !== videoId) {
      // Different video: forget its old length (re-learned on play) and refresh the title.
      staleTitle.current = value.title;
      onChange({ youtubeUrl: url, durationMin: undefined });
    } else {
      onChange({ youtubeUrl: url });
    }
  };

  // Pasting a link fills in the real YouTube title (free oEmbed, best effort) unless you typed one.
  useEffect(() => {
    if (!videoId) return;
    const replaceable = () => !titleRef.current.trim() || titleRef.current === staleTitle.current;
    if (!replaceable()) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      const title = await fetchVideoTitle(videoId, ctrl.signal);
      if (title && replaceable()) onChangeRef.current({ title });
      staleTitle.current = null;
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [videoId]);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) changeUrl(text.trim());
    } catch {
      /* clipboard permission denied — the user can still long-press → paste */
    }
  };

  const urlInvalid = hasUrl && !videoId;
  const urlMissing = showErrors && !hasUrl;

  return (
    <div className="vfields">
      <div className="vfields__link">
        <Thumbnail url={value.youtubeUrl} type={type} className="vfields__thumb" />
        <div className="field field--grow">
          <label className="field__label" htmlFor={`${uid}-url`}>
            유튜브 링크
          </label>
          <div className="field__row">
            <input
              id={`${uid}-url`}
              className={`input${urlInvalid || urlMissing ? ' is-invalid' : ''}`}
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://youtu.be/…"
              value={value.youtubeUrl}
              onChange={(e) => changeUrl(e.target.value)}
            />
            {'clipboard' in navigator && (
              <button type="button" className="field__paste" onClick={paste} aria-label="클립보드에서 링크 붙여넣기">
                <ClipboardPaste size={17} strokeWidth={2.3} />
              </button>
            )}
          </div>
          <div className={`field__hint${videoId ? ' is-ok' : urlInvalid || urlMissing ? ' is-error' : ''}`} aria-live="polite">
            {videoId ? (
              <>
                <CircleCheck size={13} strokeWidth={2.6} /> 영상을 찾았어요
              </>
            ) : urlInvalid ? (
              <>
                <TriangleAlert size={13} strokeWidth={2.6} /> 유튜브 영상 링크가 아니에요
              </>
            ) : urlMissing ? (
              '유튜브 링크를 붙여넣어 주세요'
            ) : (
              'watch?v=, youtu.be/, shorts/ 링크 모두 가능'
            )}
          </div>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-title`}>
          제목
        </label>
        <input
          id={`${uid}-title`}
          className="input"
          type="text"
          placeholder={type === 'stretch' ? '예: 아침 스트레칭' : '예: 하체 운동'}
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="field-pair">
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-dur`}>
            시간(분)
          </label>
          <input
            id={`${uid}-dur`}
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            placeholder="자동"
            value={value.durationMin ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onChange({ durationMin: Number.isFinite(n) && n > 0 ? Math.min(n, 300) : undefined });
            }}
          />
        </div>
        <div className="field field--grow">
          <label className="field__label" htmlFor={`${uid}-cat`}>
            라벨 <span className="field__opt">선택</span>
          </label>
          <input
            id={`${uid}-cat`}
            className="input"
            type="text"
            placeholder={type === 'stretch' ? '스트레칭' : '예: 지니다이어트'}
            value={value.category ?? ''}
            onChange={(e) => onChange({ category: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
}
