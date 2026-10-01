import type { HTMLAttributes } from 'react';

export const Skeleton = ({ className = '', style, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-slate-200)',
        minHeight: '1rem',
        ...style,
      }}
      {...props}
    />
  );
};
