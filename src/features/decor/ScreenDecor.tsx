import { Check, ImagePlus, RotateCw, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ImageEditor, type EditedImage } from '../../components/ImageEditor';
import { MAX_STICKERS, useDecor, useImageUrl, type DecorScreen, type ScreenBackground, type Sticker } from '../../state/Decor';
import { useBackButton } from '../../state/useBackButton';
import { useToast } from '../../state/Toast';
import { StickerPreview } from './previews';
import './decor.css';

const MIN_W = 0.08;
const MAX_W = 1.1;

export function newStickerId(): string {
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Fixed picture behind a screen, with blur and a readability veil. */
export function BackgroundLayer({ bg, url }: { bg: ScreenBackground; url: string | null }) {
  if (!url) return null;
  return (
    <div className="decor-bg" aria-hidden="true">
      <img src={url} alt="" className="decor-bg__img" style={{ filter: bg.blur ? `blur(${bg.blur}px)` : undefined, transform: bg.blur ? 'scale(1.08)' : undefined }} />
      <div className="decor-bg__veil" style={{ opacity: bg.veil }} />
    </div>
  );
}

interface StickerItemProps {
  sticker: Sticker;
  width: number;
  editing: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Sticker>) => void;
  onRemove: () => void;
}

function StickerItem({ sticker, width, editing, selected, onSelect, onChange, onRemove }: StickerItemProps) {
  const url = useImageUrl(sticker.imageId);
  // live values while a finger is down; saved when it lifts
  const [draft, setDraft] = useState<Sticker | null>(null);
  const s = draft ?? sticker;
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<
    | { kind: 'move'; px: number; py: number; x: number; y: number }
    | { kind: 'transform'; cx: number; cy: number; d: number; a: number; w: number; rot: number }
    | null
  >(null);

  const start = (e: React.PointerEvent, kind: 'move' | 'transform') => {
    if (!editing) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (kind === 'move') {
      gesture.current = { kind, px: e.clientX, py: e.clientY, x: s.x, y: s.y };
    } else {
      const r = ref.current!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      gesture.current = {
        kind,
        cx,
        cy,
        d: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
        a: Math.atan2(e.clientY - cy, e.clientX - cx),
        w: s.w,
        rot: s.rot,
      };
    }
    setDraft(s);
  };

  const move = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'move') {
      setDraft((d) => d && { ...d, x: g.x + (e.clientX - g.px) / width, y: Math.max(-0.05, g.y + (e.clientY - g.py) / width) });
    } else {
      const d = Math.hypot(e.clientX - g.cx, e.clientY - g.cy);
      const a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx);
      let rot = g.rot + ((a - g.a) * 180) / Math.PI;
      rot = ((rot + 540) % 360) - 180;
      // gentle snap to straight
      if (Math.abs(rot) < 4) rot = 0;
      setDraft((dr) => dr && { ...dr, w: Math.max(MIN_W, Math.min(MAX_W, (g.w * d) / g.d)), rot });
    }
  };

  const end = () => {
    if (!gesture.current) return;
    gesture.current = null;
    if (draft) {
      // keep at least a corner on screen
      const x = Math.max(-draft.w * 0.6, Math.min(1 - draft.w * 0.4, draft.x));
      onChange({ x, y: draft.y, w: draft.w, rot: draft.rot });
    }
    setDraft(null);
  };

  if (!url || width === 0) return null;
  const w = s.w * width;
  return (
    <div
      ref={ref}
      className={`sticker${editing ? ' is-editable' : ''}${selected ? ' is-selected' : ''}`}
      style={{ left: s.x * width, top: s.y * width, width: w, height: w * s.aspect, transform: `rotate(${s.rot}deg)` }}
      onPointerDown={(e) => start(e, 'move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <img src={url} alt="" draggable={false} className="sticker__img" />
      {editing && selected && (
        <>
          <span className="sticker__frame" aria-hidden="true" />
          <button
            type="button"
            className="sticker__btn sticker__btn--remove"
            aria-label="스티커 삭제"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
          >
            <X size={14} strokeWidth={3} />
          </button>
          <span
            className="sticker__btn sticker__btn--handle"
            role="button"
            aria-label="크기·각도 조절"
            onPointerDown={(e) => start(e, 'transform')}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <RotateCw size={14} strokeWidth={3} />
          </span>
        </>
      )}
    </div>
  );
}

interface ScreenDecorProps {
  screen: DecorScreen;
  children: ReactNode;
}

/** Wraps one tab screen with its background picture and stickers (and the arrange mode). */
export function ScreenDecor({ screen, children }: ScreenDecorProps) {
  const { decor, editing, setEditing, addSticker, updateSticker, removeSticker } = useDecor();
  const toast = useToast();
  const bg = decor.backgrounds[screen];
  const bgUrl = useImageUrl(bg?.imageId);
  const stickers = decor.stickers[screen] ?? [];
  const isEditing = editing === screen;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!isEditing) setSelected(null);
  }, [isEditing]);

  useBackButton(isEditing, () => setEditing(null));

  const add = (img: EditedImage) => {
    setFile(null);
    const el = wrapRef.current;
    if (!el || width === 0) return;
    const w = 0.34;
    const aspect = img.height / img.width;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const centerY = (window.scrollY + window.innerHeight * 0.42 - top) / width;
    const id = newStickerId();
    addSticker(screen, { id, imageId: img.imageId, x: 0.5 - w / 2, y: Math.max(0, centerY - (w * aspect) / 2), w, aspect, rot: 0 });
    setSelected(id);
  };

  const pick = () => {
    if (stickers.length >= MAX_STICKERS) {
      toast({ message: `스티커는 화면마다 ${MAX_STICKERS}개까지 붙일 수 있어요` });
      return;
    }
    fileRef.current?.click();
  };

  const cls = ['decor-screen', bg && bgUrl && 'has-bg', bg?.glass && bgUrl && 'is-glass', isEditing && 'is-editing'].filter(Boolean).join(' ');

  return (
    <div className={cls} ref={wrapRef} onPointerDown={() => isEditing && setSelected(null)}>
      {bg && <BackgroundLayer bg={bg} url={bgUrl} />}
      <div className="decor-screen__content">{children}</div>
      {stickers.length > 0 && (
        <div className="sticker-layer">
          {stickers.map((s) => (
            <StickerItem
              key={s.id}
              sticker={s}
              width={width}
              editing={isEditing}
              selected={selected === s.id}
              onSelect={() => setSelected(s.id)}
              onChange={(patch) => updateSticker(screen, s.id, patch)}
              onRemove={() => {
                removeSticker(screen, s.id);
                setSelected(null);
              }}
            />
          ))}
        </div>
      )}

      {isEditing &&
        createPortal(
          <div className="decor-editbar" role="toolbar" aria-label="스티커 꾸미기">
            <div className="decor-editbar__inner">
              <div className="decor-editbar__text">
                <strong>스티커 꾸미기</strong>
                <span>
                  {stickers.length === 0
                    ? '사진을 골라 스티커를 만들어 보세요'
                    : '끌어서 옮기고, 모서리 손잡이로 크기·각도를 바꿔요'}
                </span>
              </div>
              <div className="decor-editbar__actions">
                <button type="button" className="decor-editbar__btn" onClick={pick}>
                  <ImagePlus size={18} strokeWidth={2.4} />
                  <span>
                    사진 <span className="num">{stickers.length}/{MAX_STICKERS}</span>
                  </span>
                </button>
                <button type="button" className="decor-editbar__btn decor-editbar__btn--done" onClick={() => setEditing(null)}>
                  <Check size={18} strokeWidth={3} />
                  <span>완료</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(f);
          e.target.value = '';
        }}
      />
      <ImageEditor
        file={file}
        purpose="sticker"
        onCancel={() => setFile(null)}
        onDone={add}
        renderPreview={(url, aspect) => <StickerPreview url={url} aspect={aspect} />}
      />
    </div>
  );
}
