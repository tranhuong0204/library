interface ProgressProps {
  value: number; // 0 to 100
  variant?: 'primary' | 'accent';
  className?: string;
}

export const Progress = ({ value, variant = 'primary', className = '' }: ProgressProps) => {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-bar ${className}`}>
      <div
        className={`progress-value ${variant === 'accent' ? 'progress-value-accent' : ''}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
