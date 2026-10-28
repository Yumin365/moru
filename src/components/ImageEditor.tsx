import { FlipHorizontal2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { saveImage } from '../lib/media';
import { useToast } from '../state/Toast';
import { Button } from './Button';
import { Toggle } from './Checkbox';
import { Sheet } from './Sheet';
import './image-editor.css';

export type ImagePurpose = 'background' | 'sticker' | 'stamp' | 'icon';

export interface EditedImage {
  imageId: string;
  width: number;
  height: number;
}

interface ImageEditorProps {
  file: File | null;
  purpose: ImagePurpose;
  onCancel: () => void;
  onDone: (result: EditedImage) => void;
  /** How the result will look in the app (gets a small rendered preview). */
  renderPreview?: (previewUrl: string, aspect: number) => ReactNode;
}

type AspectKey = 'screen' | 'original' | '1:1' | '4:5' | '3:4' | '9:16' | '4:3' | '16:9';

const CONFIG: Record<
  ImagePurpose,
  { title: string; aspects: AspectKey[]; sizes: { label: string; px: number }[]; type: 'image/jpeg' | 'image/png'; circle?: boolean }
> = {
  background: {
    title: '배경 이미지 편집',
    aspects: ['screen', 'original', '3:4', '9:16', '4:3', '16:9'],
    sizes: [
      { label: '작게', px: 1080 },
      { label: '보통', px: 1600 },
      { label: '크게', px: 2048 },
    ],
    type: 'image/jpeg',
  },
  sticker: {
    title: '스티커 편집',
    aspects: ['original', '1:1', '4:5', '4:3', '16:9'],
    sizes: [
      { label: '작게', px: 320 },
      { label: '보통', px: 520 },
      { label: '크게', px: 800 },
    ],
    type: 'image/png',
  },
  icon: {
    title: '앱 아이콘 편집',
    aspects: ['1:1'],
    sizes: [{ label: '기본', px: 512 }],
    type: 'image/jpeg', // home-screen icons can't be see-through
  },
  stamp: {
    title: '도장 이미지 편집',
    aspects: ['1:1'],
    sizes: [
      { label: '작게', px: 256 },
      { label: '보통', px: 384 },
      { label: '크게', px: 512 },
    ],
    type: 'image/png',
    circle: true,
  },
};

const ASPECT_LABEL: Record<AspectKey, string> = {
  screen: '화면 비율',
  original: '원본',
  '1:1': '1:1',
  '4:5': '4:5',
  '3:4': '3:4',
  '9:16': '9:16',
  '4:3': '4:3',
  '16:9': '16:9',
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/**
 * Crop / rotate / zoom an uploaded picture before it is saved. The crop frame
 * stays still; the picture moves under it (drag, pinch, wheel or slider).
 */
export function ImageEditor({ file, purpose, onCancel, onDone, renderPreview }: ImageEditorProps) {
  const cfg = CONFIG[purpose];
  const toast = useToast();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [rot, setRot] = useState(0); // quarter turns
  const [flip, setFlip] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [aspectChoice, setAspectKey] = useState<AspectKey>(cfg.aspects[0]);
  const aspectKey = cfg.aspects.includes(aspectChoice) ? aspectChoice : cfg.aspects[0];
  const [sizeIdx, setSizeIdx] = useState(Math.min(1, cfg.sizes.length - 1));
  // the same editor is reused for other purposes, whose size lists differ
  const sizeAt = Math.min(sizeIdx, cfg.sizes.length - 1);
  const [circle, setCircle] = useState(false);
  const [stageW, setStageW] = useState(320);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // load the picked file
  useEffect(() => {
    if (!file) return;
    setImg(null);
    setRot(0);
    setFlip(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setAspectKey(cfg.aspects[0]);
    setSizeIdx(Math.min(1, cfg.sizes.length - 1));
    setCircle(false);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => {
      toast({ message: '이 사진은 열 수 없어요. JPG·PNG 파일로 다시 시도해 주세요' });
      onCancel();
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  // stage width
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, [img]);

  const iw = img?.naturalWidth ?? 1;
  const ih = img?.naturalHeight ?? 1;
  const rw = rot % 2 ? ih : iw;
  const rh = rot % 2 ? iw : ih;

  const aspect = useMemo(() => {
    switch (aspectKey) {
      case 'screen':
        return window.innerWidth / window.innerHeight;
      case 'original':
        return rw / rh;
      default: {
        const [a, b] = aspectKey.split(':').map(Number);
        return a / b;
      }
    }
  }, [aspectKey, rw, rh]);

  // frame size (fits the stage width and ~half the screen height)
  const maxH = Math.min(window.innerHeight * 0.46, 440);
  const fw = Math.min(stageW, maxH * aspect);
  const fh = fw / aspect;
  const base = Math.max(fw / rw, fh / rh);
  const scale = base * zoom;
  const clamp = useCallback(
    (o: { x: number; y: number }, s = scale) => {
      const mx = Math.max(0, (rw * s - fw) / 2);
      const my = Math.max(0, (rh * s - fh) / 2);
      return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
    },
    [scale, rw, rh, fw, fh],
  );
  const off = clamp(offset);

  // reset position when the framing changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [aspectKey, rot]);

  // ── gestures ─────────────────────────────
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (z * d) / pinch.current!)));
      pinch.current = d;
    } else if (pointers.current.size === 1) {
      setOffset((o) => clamp({ x: clamp(o).x + e.clientX - prev.x, y: clamp(o).y + e.clientY - prev.y }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.exp(-e.deltaY * 0.0015))));
  };

  // ── output ─────────────────────────────
  const outputSize = useCallback(
    (longEdge: number) => {
      let W = aspect >= 1 ? longEdge : longEdge * aspect;
      // never upscale beyond the picture's real pixels inside the frame
      W = Math.min(W, fw / scale);
      W = Math.max(16, Math.round(W));
      return { W, H: Math.max(16, Math.round(W / aspect)) };
    },
    [aspect, fw, scale],
  );

  const render = useCallback(
    (longEdge: number): HTMLCanvasElement | null => {
      if (!img) return null;
      const { W, H } = outputSize(longEdge);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.imageSmoothingQuality = 'high';
      if (cfg.type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      }
      if (circle) {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      const k = W / fw;
      ctx.translate(W / 2 + off.x * k, H / 2 + off.y * k);
      ctx.rotate((rot * Math.PI) / 2);
      ctx.scale(flip ? -1 : 1, 1);
      const dw = iw * scale * k;
      const dh = ih * scale * k;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      return canvas;
    },
    [img, outputSize, cfg.type, circle, fw, off.x, off.y, rot, flip, iw, ih, scale],
  );

  // live preview (throttled)
  useEffect(() => {
    if (!img || !renderPreview) return;
    const t = window.setTimeout(() => {
      const c = render(420);
      if (c) setPreviewUrl(c.toDataURL(cfg.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.8));
    }, 140);
    return () => clearTimeout(t);
  }, [img, render, renderPreview, cfg.type]);

  const apply = async () => {
    const canvas = render(cfg.sizes[sizeAt].px);
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, cfg.type, 0.86));
      if (!blob) throw new Error('encode');
      const imageId = await saveImage(blob, canvas.width, canvas.height);
      onDone({ imageId, width: canvas.width, height: canvas.height });
    } catch {
      toast({ message: '이미지를 저장하지 못했어요. 저장 공간을 확인해 주세요' });
    } finally {
      setSaving(false);
    }
  };

  const size = outputSize(cfg.sizes[sizeAt].px);

  return (
    <Sheet
      open={file !== null}
      onClose={onCancel}
      tall
      eyebrow="내 이미지"
      title={cfg.title}
      footer={
        <div className="editor-footer">
          <Button variant="ghost" onClick={onCancel}>
            취소
          </Button>
          <Button variant="dark" size="lg" className="editor-footer__save" onClick={() => void apply()} disabled={!img || saving}>
            {saving ? '저장 중…' : '적용'}
          </Button>
        </div>
      }
    >
      <div className="imged">
        <div className="imged__stage" ref={stageRef} style={{ height: maxH }}>
          {img ? (
            <div
              className={`imged__frame${circle ? ' is-circle' : ''}${purpose === 'icon' ? ' is-icon' : ''}${cfg.type === 'image/png' ? ' is-transparent' : ''}`}
              style={{ width: fw, height: fh }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="imged__img"
                style={{
                  width: iw * scale,
                  height: ih * scale,
                  transform: `translate(-50%, -50%) translate(${off.x}px, ${off.y}px) rotate(${rot * 90}deg) scaleX(${flip ? -1 : 1})`,
                }}
              />
              <span className="imged__grid" aria-hidden="true" />
            </div>
          ) : (
            <p className="imged__loading">불러오는 중…</p>
          )}
        </div>
        <p className="imged__hint">끌어서 위치를 옮기고, 두 손가락이나 아래 막대로 확대해요.</p>

        <div className="imged__tools">
          <button type="button" className="imged__tool" onClick={() => setRot((r) => (r + 3) % 4)} aria-label="왼쪽으로 회전">
            <RotateCcw size={18} strokeWidth={2.3} />
          </button>
          <button type="button" className="imged__tool" onClick={() => setRot((r) => (r + 1) % 4)} aria-label="오른쪽으로 회전">
            <RotateCw size={18} strokeWidth={2.3} />
          </button>
          <button type="button" className={`imged__tool${flip ? ' is-on' : ''}`} onClick={() => setFlip((f) => !f)} aria-label="좌우 뒤집기">
            <FlipHorizontal2 size={18} strokeWidth={2.3} />
          </button>
          <div className="imged__zoom">
            <ZoomOut size={16} strokeWidth={2.3} aria-hidden="true" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="확대"
            />
            <ZoomIn size={16} strokeWidth={2.3} aria-hidden="true" />
          </div>
        </div>

        {cfg.aspects.length > 1 && (
          <div className="imged__row">
            <span className="imged__label">비율</span>
            <div className="imged__chips">
              {cfg.aspects.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`imged__chip${aspectKey === a ? ' is-on' : ''}`}
                  onClick={() => setAspectKey(a)}
                  aria-pressed={aspectKey === a}
                >
                  {ASPECT_LABEL[a]}
                </button>
              ))}
            </div>
          </div>
        )}

        {cfg.circle && (
          <div className="imged__row imged__row--between">
            <span className="imged__label">원형으로 자르기</span>
            <Toggle checked={circle} onChange={setCircle} label="원형으로 자르기" />
          </div>
        )}

        <div className="imged__row">
          <span className="imged__label">크기</span>
          {cfg.sizes.length > 1 && (
          <div className="imged__chips">
            {cfg.sizes.map((s, i) => (
              <button
                key={s.label}
                type="button"
                className={`imged__chip${sizeAt === i ? ' is-on' : ''}`}
                onClick={() => setSizeIdx(i)}
                aria-pressed={sizeAt === i}
              >
                {s.label}
              </button>
            ))}
          </div>
          )}
          <span className="imged__px num">
            {size.W} × {size.H}px
          </span>
        </div>

        {renderPreview && previewUrl && (
          <div className="imged__preview">
            <span className="imged__label">미리보기</span>
            <div className="imged__preview-box">{renderPreview(previewUrl, aspect)}</div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
