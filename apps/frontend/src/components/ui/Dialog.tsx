import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export const Dialog = ({ isOpen, onClose, title, children, footer, maxWidth = '500px' }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  // Keep the latest callback without restarting the focus effect on every render.
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    if (isOpen) {
      const previouslyFocusedElement = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      const focusTimer = window.setTimeout(() => {
        const firstField = dialogRef.current?.querySelector<HTMLElement>(
          '.dialog-body input:not([disabled]), .dialog-body select:not([disabled]), .dialog-body textarea:not([disabled]), .dialog-body button:not([disabled])',
        );
        (firstField ?? dialogRef.current)?.focus();
      }, 50);

      return () => {
        window.clearTimeout(focusTimer);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement?.focus();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="dialog-overlay" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="dialog"
        style={{ maxWidth, outline: 'none' }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="dialog-header">
          <div className="dialog-title-group">
            <span className="dialog-title-mark" aria-hidden="true"><Sparkles size={17} /></span>
            <div>
              <small>Library AI Workspace</small>
              <h3 id={titleId}>{title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn dialog-close-button" aria-label="Đóng hộp thoại">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};
