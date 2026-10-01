import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  containerClassName?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, containerClassName = '', className = '', placeholder, ...props }, ref) => {
    return (
      <div className={`form-field ${containerClassName}`}>
        {label && <label className="form-label">{label}</label>}
        <select
          ref={ref}
          className={`form-select ${error ? 'form-input-error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="form-error-text">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
