import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  debounceMs = 300,
  className = '',
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return;

    const handler = setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, value, debounceMs]);

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-slate-400)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        className="form-input"
        style={{ paddingLeft: '40px' }}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
    </div>
  );
};
