/* eslint-disable react-refresh/only-export-components -- toast factory and renderer intentionally share this module */
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface SuccessToastProps {
  title: string;
  description?: string;
}

const SuccessToast = ({ title, description }: SuccessToastProps) => (
  <div className="success-toast" role="status" aria-live="polite">
    <div className="success-toast-icon" aria-hidden="true">
      <Check size={20} strokeWidth={3.25} />
    </div>
    <div className="success-toast-content">
      <span className="success-toast-title">{title}</span>
      {description && <span className="success-toast-description">{description}</span>}
    </div>
  </div>
);

export const showSuccessToast = (
  title: string,
  description?: string,
  duration = 4000,
): string | number => toast.custom(
  () => <SuccessToast title={title} description={description} />,
  {
    duration,
    style: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      padding: 0,
    },
  },
);

export default SuccessToast;
