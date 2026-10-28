import type { ReactNode } from 'react';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = '취소',
  destructive,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} kind="dialog" hideClose>
      <div className="confirm">
        {icon && <div className={`confirm__icon${destructive ? ' is-danger' : ''}`}>{icon}</div>}
        <h2 className="confirm__title">{title}</h2>
        {message && <p className="confirm__message">{message}</p>}
        <div className="confirm__actions">
          <Button variant="soft" size="lg" block onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'dark'} size="lg" block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
