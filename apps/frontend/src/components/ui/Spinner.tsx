interface SpinnerProps {
  size?: number;
  variant?: 'primary' | 'accent';
  className?: string;
}

export const Spinner = ({ size = 24, variant = 'primary', className = '' }: SpinnerProps) => {
  return (
    <div
      className={`spinner ${variant === 'accent' ? 'spinner-accent' : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
};
