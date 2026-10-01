import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu vào lúc này. Vui lòng thử lại.',
  onRetry,
}: ErrorStateProps) => (
  <div className="error-state">
    <div className="state-icon state-icon-error"><AlertTriangle size={28} /></div>
    <div className="state-copy"><h3>{title}</h3><p>{message}</p></div>
    {onRetry && <Button variant="danger" onClick={onRetry}><RotateCcw size={16} /> Thử lại</Button>}
  </div>
);

export default ErrorState;
