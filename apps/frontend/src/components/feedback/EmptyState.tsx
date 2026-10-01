import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, message, icon, actionText, onAction }: EmptyStateProps) => (
  <div className="empty-state">
    <div className="state-icon state-icon-neutral">{icon || <Inbox size={30} />}</div>
    <div className="state-copy"><h3>{title}</h3><p>{message}</p></div>
    {actionText && onAction && <Button variant="primary" onClick={onAction}>{actionText}</Button>}
  </div>
);

export default EmptyState;
