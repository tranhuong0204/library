import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, error, containerClassName = '', className = '', checked, onChange, ...props }, ref) => {
    return (
      <div
        className={`form-field ${containerClassName}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 'var(--spacing-3)',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
          <input
            ref={ref}
            className={className}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'pointer' }}
            {...props}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              cursor: props.disabled ? 'not-allowed' : 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: checked ? 'var(--color-primary-600)' : 'var(--color-slate-300)',
              transition: 'var(--transition-fast)',
              borderRadius: '24px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                content: '""',
                height: '18px',
                width: '18px',
                left: '3px',
                bottom: '3px',
                backgroundColor: 'white',
                transition: 'var(--transition-fast)',
                borderRadius: '50%',
                transform: checked ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </span>
        </label>
        {label && (
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-slate-700)', cursor: 'pointer' }}>
            {label}
          </span>
        )}
        {error && <span className="form-error-text">{error}</span>}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
