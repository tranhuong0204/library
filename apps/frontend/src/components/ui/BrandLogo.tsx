import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  subtitle?: string;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  compact = false,
  subtitle,
  className = '',
  variant = 'auto',
}) => {
  const iconDimensions = {
    sm: { width: 30, height: 30, radius: 8, stroke: 1.8 },
    md: { width: 38, height: 38, radius: 11, stroke: 1.85 },
    lg: { width: 48, height: 48, radius: 14, stroke: 1.95 },
  }[size];

  return (
    <div
      className={`brand-modern-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
      }}
    >
      {/* Botanical Folio Emblem */}
      <div
        className="brand-emblem"
        style={{
          width: iconDimensions.width,
          height: iconDimensions.height,
          borderRadius: iconDimensions.radius,
          background: 'linear-gradient(145deg, #1f3329 0%, #294437 100%)',
          border: '1px solid var(--dp-color-ornament-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dp-color-ground)',
          boxShadow: '0 4px 12px -3px rgba(31, 51, 41, 0.25)',
          flexShrink: 0,
          position: 'relative',
          transition: 'transform var(--dp-motion-interaction) var(--dp-motion-easing)',
        }}
      >
        <svg
          width={iconDimensions.width * 0.58}
          height={iconDimensions.height * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={iconDimensions.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Architectural Open Book Folio Geometry with Botanical Sprout */}
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 8h6" />
          <path d="M8 12h4" />
          <path d="M12 4.5c1.2 0 2.2.8 2.5 1.9" stroke="var(--dp-color-accent)" strokeWidth="1.6" />
        </svg>

        {/* Ambient Terracotta Accent Pip */}
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: 'var(--dp-color-accent)',
            border: '1.5px solid var(--dp-color-ground)',
            boxShadow: '0 0 4px rgba(126, 83, 67, 0.45)',
          }}
          aria-hidden="true"
        />
      </div>

      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-display)',
                fontWeight: 600,
                fontSize: size === 'lg' ? '1.4rem' : size === 'md' ? '1.18rem' : '0.98rem',
                letterSpacing: '-0.01em',
                color: variant === 'light' ? 'var(--dp-color-ground)' : 'currentColor',
              }}
            >
              LIBRIA
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: 'var(--dp-typography-label-tracking)',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: 'rgba(126, 83, 67, 0.12)',
                color: 'var(--dp-color-accent)',
                border: '1px solid rgba(126, 83, 67, 0.25)',
                textTransform: 'uppercase',
                fontFamily: 'var(--dp-typography-reading)',
              }}
            >
              AI
            </span>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              letterSpacing: 'var(--dp-typography-label-tracking)',
              textTransform: 'uppercase',
              color: variant === 'light' ? 'rgba(249, 247, 242, 0.7)' : 'var(--dp-color-field-line)',
              marginTop: '3px',
              fontWeight: 500,
              fontFamily: 'var(--dp-typography-reading)',
            }}
          >
            {subtitle || 'Knowledge Workspace'}
          </span>
        </div>
      )}
    </div>
  );
};
