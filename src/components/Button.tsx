import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './components.css';

type Variant = 'primary' | 'dark' | 'soft' | 'ghost' | 'danger' | 'outline';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  trailingIcon,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size}${block ? ' btn--block' : ''} ${className}`}
      {...rest}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children && <span className="btn__label">{children}</span>}
      {trailingIcon && <span className="btn__icon">{trailingIcon}</span>}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'plain' | 'surface' | 'dark' | 'glass';
  size?: number;
  children: ReactNode;
}

/** Round icon-only button. `label` becomes the aria-label (required for accessibility). */
export function IconButton({ label, variant = 'surface', size = 44, className = '', children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`icon-btn icon-btn--${variant} ${className}`}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  );
}
