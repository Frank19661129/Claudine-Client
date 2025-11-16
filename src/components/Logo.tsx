import type { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`font-semibold tracking-tight ${sizeClasses[size]}`}>
      <span className="logo-gs">GS</span>
      <span className="logo-ai">ai</span>
    </div>
  );
};
