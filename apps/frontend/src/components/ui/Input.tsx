import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`form-field ${containerClassName}`}>
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className={`form-field ${containerClassName}`}>
        {label && <label className="form-label">{label}</label>}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            ref={ref}
            type={show ? 'text' : 'password'}
            className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
            style={{ paddingRight: '40px' }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-slate-400)',
              display: 'flex',
              alignItems: 'center',
            }}
            tabIndex={-1}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <span className="form-error-text">{error}</span>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
