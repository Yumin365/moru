import { Check } from 'lucide-react';
import './components.css';

interface CheckMarkProps {
  checked: boolean;
  size?: number;
  tone?: 'accent' | 'dark';
  shape?: 'circle' | 'square';
}

/** Purely visual animated check (use inside a labelled control). */
export function CheckMark({ checked, size = 26, tone = 'accent', shape = 'circle' }: CheckMarkProps) {
  return (
    <span
      className={`checkmark checkmark--${tone} checkmark--${shape}${checked ? ' is-checked' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Check size={Math.round(size * 0.62)} strokeWidth={3.2} />
    </span>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** iOS-style switch, accessible as role="switch". */
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__thumb" />
    </button>
  );
}
