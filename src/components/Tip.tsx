import { Lightbulb, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTip, type TipId } from '../lib/onboarding';
import './tip.css';

/** A one-time hint banner; once closed it never comes back (until 사용법 다시 보기). */
export function Tip({ id, children, className = '' }: { id: TipId; children: ReactNode; className?: string }) {
  const [visible, dismiss] = useTip(id);
  if (!visible) return null;
  return (
    <div className={`tip ${className}`} role="note">
      <span className="tip__icon" aria-hidden="true">
        <Lightbulb size={16} strokeWidth={2.4} />
      </span>
      <p className="tip__text">{children}</p>
      <button type="button" className="tip__close" onClick={dismiss} aria-label="팁 닫기">
        <X size={15} strokeWidth={2.6} />
      </button>
    </div>
  );
}
