import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = ({ children, hoverable = false, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};
