import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export const Tooltip = ({ children, content }: TooltipProps) => {
  return (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-popup">{content}</div>
    </div>
  );
};
