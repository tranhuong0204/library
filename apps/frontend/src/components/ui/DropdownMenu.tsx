import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const DropdownMenu = ({ trigger, items, align = 'right' }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="dropdown">
      <div className="dropdown-trigger" onClick={() => setOpen(!open)}>
        {trigger}
      </div>

      {open && (
        <div
          className={`dropdown-panel align-${align}`}
          role="menu"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              role="menuitem"
              className={`dropdown-item ${item.danger ? 'is-danger' : ''}`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
