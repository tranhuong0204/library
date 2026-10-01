import { Button } from './Button';
import { Dialog } from './Dialog';
import { AlertTriangle, CircleHelp } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) => {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={isDestructive ? 'danger' : 'primary'}
        onClick={onConfirm}
        isLoading={isLoading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} footer={footer} maxWidth="420px">
      <div className={`confirm-dialog-content ${isDestructive ? 'is-destructive' : ''}`}>
        <span className="confirm-dialog-icon" aria-hidden="true">
          {isDestructive ? <AlertTriangle size={22} /> : <CircleHelp size={22} />}
        </span>
        <p>{message}</p>
      </div>
    </Dialog>
  );
};
