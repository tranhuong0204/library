import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ children, variant = 'primary', className = '', ...props }: BadgeProps) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
};
