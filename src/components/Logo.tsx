import type { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: { text: 'text-base', img: 'h-6 w-6' },
    md: { text: 'text-xl', img: 'h-8 w-8' },
    lg: { text: 'text-3xl', img: 'h-12 w-12' },
  };

  return (
    <div className={`flex items-center gap-2 font-semibold tracking-tight ${sizeClasses[size].text}`}>
      <img
        src="/pepper-avatar.jpg"
        alt="Pepper"
        className={`${sizeClasses[size].img} rounded-full object-cover object-top border-2 border-white/30`}
      />
      <span className="text-white">Pepper</span>
    </div>
  );
};
