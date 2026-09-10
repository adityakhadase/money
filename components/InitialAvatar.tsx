import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  indicatorColor?: string;
}

// Consistent color palettes based on name
const AVATAR_COLORS = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-secondary-container/60 text-on-secondary-container border-secondary/30',
  'bg-surface-container-highest text-primary border-primary/20',
  'bg-primary-fixed text-on-primary-fixed-variant border-primary/20',
  'bg-tertiary-container/20 text-tertiary border-tertiary/20',
];

function getAvatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function InitialAvatar({
  name,
  size = 'md',
  className,
  indicatorColor,
}: AvatarProps) {
  const initial = (name && name.trim().length > 0 ? name.trim()[0] : 'U').toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-12 h-12 text-base font-extrabold',
    xl: 'w-14 h-14 text-lg font-extrabold',
  };

  const colorClass = getAvatarColor(name);

  return (
    <div className="relative flex-shrink-0 inline-block">
      <div
        className={cn(
          'rounded-full flex items-center justify-center select-none border transition-all',
          sizeClasses[size],
          colorClass,
          className
        )}
      >
        <span>{initial}</span>
      </div>
      {indicatorColor && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-surface-container-lowest',
            indicatorColor
          )}
        />
      )}
    </div>
  );
}
