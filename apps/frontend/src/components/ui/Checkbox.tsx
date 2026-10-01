import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`form-field ${containerClassName}`} style={{ marginBottom: 'var(--spacing-4)' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-slate-700)',
          }}
        >
          <input
            ref={ref}
            type="checkbox"
            className={className}
            style={{
              width: '16px',
              height: '16px',
              accentColor: 'var(--color-primary-600)',
              cursor: 'pointer',
            }}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && <span className="form-error-text" style={{ marginTop: '4px' }}>{error}</span>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
