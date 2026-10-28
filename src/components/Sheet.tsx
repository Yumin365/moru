import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBackButton } from '../state/useBackButton';
import { IconButton } from './Button';
import './components.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** 'sheet' slides up from the bottom on phones; 'dialog' is always a centred card. */
  kind?: 'sheet' | 'dialog';
  /** Tall sheets (editors) take most of the screen. */
  tall?: boolean;
  hideClose?: boolean;
}

const EXIT_MS = 240;
let openCount = 0;

/** Bottom sheet / dialog with backdrop, Esc-to-close, scroll lock and focus handling. */
export function Sheet({ open, onClose, title, eyebrow, children, footer, kind = 'sheet', tall, hideClose }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useBackButton(open, onClose);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    openCount++;
    document.body.classList.add('is-locked');
    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current;
      target?.focus({ preventScroll: true });
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const panels = document.querySelectorAll('.sheet-panel');
        if (panels[panels.length - 1] !== panelRef.current) return; // only the top-most sheet closes
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      openCount--;
      if (openCount === 0) document.body.classList.remove('is-locked');
      previous?.focus?.({ preventScroll: true });
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className={`sheet-root sheet-root--${kind}${closing ? ' is-closing' : ''}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className={`sheet-panel${tall ? ' sheet-panel--tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {kind === 'sheet' && <div className="sheet-grabber" aria-hidden="true" />}
        {(title || !hideClose) && (
          <div className="sheet-head">
            <div className="sheet-head__text">
              {eyebrow && <div className="overline">{eyebrow}</div>}
              {title && (
                <h2 id={titleId} className="sheet-title">
                  {title}
                </h2>
              )}
            </div>
            {!hideClose && (
              <IconButton label="닫기" variant="plain" size={40} onClick={onClose}>
                <X size={20} strokeWidth={2.4} />
              </IconButton>
            )}
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
