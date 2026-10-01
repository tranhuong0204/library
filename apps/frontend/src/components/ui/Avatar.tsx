import { useState } from 'react';
import type { CSSProperties } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export const Avatar = ({ src, alt = '', fallback, size = 40, className = '', style }: AvatarProps) => {
  const [error, setError] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        fontSize: `${size * 0.4}px`,
        ...style,
      }}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{getInitials(fallback)}</span>
      )}
    </div>
  );
};
