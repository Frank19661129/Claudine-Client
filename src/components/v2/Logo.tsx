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
    <div className={`font-semibold tracking-tight ${sizeClasses[size]} text-white flex items-baseline`}>
      <span>Claudine</span>
      <span className="text-accent">.</span>
      <span className="text-sm font-light opacity-90">Assistent</span>
    </div>
  );
};
