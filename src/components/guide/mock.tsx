/**
 * Tiny drawing kit for guide illustrations: a device frame, browser bars and a
 * highlight ring with a numbered "tap here" marker. Pure CSS — no screenshots.
 */
import { EllipsisVertical, House, Lock, Search, Share, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import './mock.css';

export function Device({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`mk-device${wide ? ' mk-device--wide' : ''}`}>
      <div className="mk-screen">{children}</div>
    </div>
  );
}

/** Highlights its children with a pulsing ring; `n` shows a numbered tap marker. */
export function Hl({ children, n, block, className = '' }: { children: ReactNode; n?: number; block?: boolean; className?: string }) {
  return (
    <span className={`mk-hl${block ? ' mk-hl--block' : ''} ${className}`}>
      {children}
      {n !== undefined && <span className="mk-tap num">{n}</span>}
    </span>
  );
}

interface BarProps {
  url: string;
  /** text typed into the address bar (shows a caret) */
  typed?: string;
  star?: 'show' | 'hl';
  menu?: 'show' | 'hl';
  starTap?: number;
  menuTap?: number;
}

/** Chrome (Android tablet) toolbar. */
export function ChromeBar({ url, typed, star = 'show', menu = 'show', starTap, menuTap }: BarProps) {
  const starIcon = <Star size={13} strokeWidth={2.4} />;
  const menuIcon = <EllipsisVertical size={14} strokeWidth={2.6} />;
  return (
    <div className="mk-bar">
      <House size={13} strokeWidth={2.4} className="mk-bar__icon" />
      <div className={`mk-bar__url${typed !== undefined ? ' is-typing' : ''}`}>
        {typed !== undefined ? (
          <>
            <Search size={11} strokeWidth={2.6} />
            <span className="mk-bar__typed">{typed}</span>
            <span className="mk-caret" />
          </>
        ) : (
          <>
            <Lock size={10} strokeWidth={2.6} />
            <span className="mk-bar__text">{url}</span>
            <span className="mk-bar__star">{star === 'hl' ? <Hl n={starTap}>{starIcon}</Hl> : starIcon}</span>
          </>
        )}
      </div>
      <span className="mk-bar__tabs">2</span>
      <span className="mk-bar__icon">{menu === 'hl' ? <Hl n={menuTap}>{menuIcon}</Hl> : menuIcon}</span>
    </div>
  );
}

/** Safari (iPad) toolbar with the share button. */
export function SafariBar({ url, share, shareTap }: { url: string; share?: 'hl'; shareTap?: number }) {
  return (
    <div className="mk-bar mk-bar--safari">
      <span className="mk-bar__icon mk-dim">‹ ›</span>
      <div className="mk-bar__url">
        <Lock size={10} strokeWidth={2.6} />
        <span className="mk-bar__text">{url}</span>
      </div>
      <span className="mk-bar__icon">
        {share === 'hl' ? (
          <Hl n={shareTap}>
            <Share size={14} strokeWidth={2.4} />
          </Hl>
        ) : (
          <Share size={14} strokeWidth={2.4} />
        )}
      </span>
    </div>
  );
}

/** Grey placeholder text lines. */
export function Lines({ n = 3, short }: { n?: number; short?: boolean }) {
  return (
    <div className="mk-lines">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ width: `${short ? 40 : 90 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function MockButton({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'lime' | 'soft' }) {
  return <span className={`mk-btn mk-btn--${tone}`}>{children}</span>;
}

export function BookmarkRow({ title, sub, hl, tap }: { title: string; sub: string; hl?: boolean; tap?: number }) {
  const row = (
    <span className="mk-suggest__row">
      <Star size={12} strokeWidth={2.6} className="mk-suggest__icon is-star" />
      <span className="mk-suggest__text">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
    </span>
  );
  return hl ? (
    <Hl block n={tap}>
      {row}
    </Hl>
  ) : (
    row
  );
}

export function SearchRow({ text }: { text: string }) {
  return (
    <span className="mk-suggest__row mk-dim">
      <Search size={12} strokeWidth={2.6} className="mk-suggest__icon" />
      <span className="mk-suggest__text">
        <b>{text}</b>
        <small>Google 검색</small>
      </span>
    </span>
  );
}

/** Desktop browser window: tab strip, toolbar and bookmarks bar. */
export function DesktopWindow({
  url,
  bar,
  barHl,
  barTap,
  children,
}: {
  url: string;
  bar?: ReactNode;
  barHl?: boolean;
  barTap?: number;
  children?: ReactNode;
}) {
  const bookmarks = <div className="mk-bmbar">{bar ?? <span className="mk-dim">북마크바</span>}</div>;
  return (
    <div className="mk-window">
      <div className="mk-window__tabs">
        <i />
        <i />
        <i />
        <span className="mk-window__tab">모루</span>
      </div>
      <div className="mk-bar">
        <span className="mk-bar__icon mk-dim">← →</span>
        <div className="mk-bar__url">
          <Lock size={10} strokeWidth={2.6} />
          <span className="mk-bar__text">{url}</span>
          <Star size={12} strokeWidth={2.4} className="mk-bar__star" />
        </div>
        <EllipsisVertical size={14} strokeWidth={2.6} className="mk-bar__icon" />
      </div>
      {barHl ? (
        <Hl block n={barTap}>
          {bookmarks}
        </Hl>
      ) : (
        bookmarks
      )}
      <div className="mk-window__page">{children}</div>
    </div>
  );
}

export function BookmarkChip({ label, hl, tap }: { label: string; hl?: boolean; tap?: number }) {
  const chip = (
    <span className="mk-bmchip">
      <Star size={10} strokeWidth={2.6} /> {label}
    </span>
  );
  return hl ? <Hl n={tap}>{chip}</Hl> : chip;
}
