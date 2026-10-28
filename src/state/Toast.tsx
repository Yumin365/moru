import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const ToastContext = createContext<(opts: ToastOptions) => void>(() => {});

/** Single snackbar at the bottom (with optional Undo). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setToast(null), 200);
  }, []);

  const show = useCallback(
    (opts: ToastOptions) => {
      clearTimeout(timer.current);
      setLeaving(false);
      setToast({ ...opts, id: Date.now() });
      timer.current = window.setTimeout(dismiss, opts.duration ?? 3800);
    },
    [dismiss],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div className={`toast${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite" key={toast.id}>
            <span className="toast__msg">{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.onAction?.();
                  clearTimeout(timer.current);
                  dismiss();
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
