import { StampView } from '../../components/Stamp';
import type { ScreenBackground, StampSettings } from '../../state/Decor';

/** A tiny drawing of an app screen (hero card + a few rows) to preview decorations on. */
export function MiniScreen({
  bg,
  bgUrl,
  children,
  width = 150,
}: {
  bg?: Pick<ScreenBackground, 'blur' | 'veil' | 'glass'> | null;
  bgUrl?: string | null;
  children?: React.ReactNode;
  width?: number;
}) {
  const glass = !!(bg?.glass && bgUrl);
  const k = width / 150;
  return (
    <div className={`mini${glass ? ' is-glass' : ''}`} style={{ width, height: width * 1.78 }}>
      {bgUrl && (
        <div className="mini__bg">
          <img
            src={bgUrl}
            alt=""
            style={{ filter: bg?.blur ? `blur(${bg.blur * k * 0.5}px)` : undefined, transform: bg?.blur ? 'scale(1.08)' : undefined }}
          />
          <div className="mini__veil" style={{ opacity: bg?.veil ?? 0 }} />
        </div>
      )}
      <div className="mini__content">
        <span className="mini__title" />
        <span className="mini__hero">
          <span className="mini__ring" />
        </span>
        <span className="mini__card" />
        <span className="mini__card" />
        <span className="mini__card" />
      </div>
      {children}
    </div>
  );
}

export function StickerPreview({ url, aspect }: { url: string; aspect: number }) {
  const w = 54;
  return (
    <MiniScreen>
      <img
        src={url}
        alt=""
        className="mini__sticker"
        style={{ width: w, height: w / aspect, left: 150 - w - 14, top: 40, transform: 'rotate(-6deg)' }}
      />
    </MiniScreen>
  );
}

export function BackgroundPreview({ url, bg }: { url: string; bg: Pick<ScreenBackground, 'blur' | 'veil' | 'glass'> }) {
  return <MiniScreen bg={bg} bgUrl={url} />;
}

/** How a stamp looks on a finished card, a calendar day and the completion screen. */
export function StampPreview({ settings, imageUrl, play }: { settings: StampSettings; imageUrl?: string | null; play?: number }) {
  return (
    <div className="stamp-preview">
      <div className="stamp-preview__big">
        <StampView key={play} settings={settings} imageUrl={imageUrl} size={112} seed="preview" play />
      </div>
      <div className="stamp-preview__uses">
        <div className="stamp-preview__card">
          <span className="stamp-preview__thumb" />
          <span className="stamp-preview__lines">
            <span />
            <span />
          </span>
          <StampView settings={settings} imageUrl={imageUrl} size={60} seed="card" />
        </div>
        <div className="stamp-preview__cal">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`stamp-preview__day${i === 1 ? ' is-full' : ''}`}>
              <span className="num">{14 + i}</span>
              {i === 1 && <StampView settings={settings} imageUrl={imageUrl} size="112%" seed="cal" inherit />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The icon on a little home screen, plus the shapes launchers cut it into. */
export function IconPreview({ url }: { url: string }) {
  return (
    <div className="icon-preview">
      <div className="icon-home" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="icon-home__app">
            <i />
            <small>앱</small>
          </span>
        ))}
        <span className="icon-home__app is-ours">
          <img src={url} alt="" />
          <small>모루</small>
        </span>
      </div>
      <div className="icon-shapes" aria-hidden="true">
        <span className="icon-shape">
          <img src={url} alt="" className="is-squircle" />
          <small>아이폰·갤럭시</small>
        </span>
        <span className="icon-shape">
          <img src={url} alt="" className="is-circle" />
          <small>원형 아이콘 폰</small>
        </span>
      </div>
    </div>
  );
}
