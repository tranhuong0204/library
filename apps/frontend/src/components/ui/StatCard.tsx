import type { ReactNode } from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard = ({
  value,
  label,
  icon,
  iconBgColor = 'var(--color-primary-50)',
  iconColor = 'var(--color-primary-600)',
}: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: iconBgColor, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};
