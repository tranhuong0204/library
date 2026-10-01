import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`form-field ${containerClassName}`}>
        {label && <label className="form-label">{label}</label>}
        <textarea
          ref={ref}
          className={`form-textarea ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        />
        {error && <span className="form-error-text">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
