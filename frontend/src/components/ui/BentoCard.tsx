'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  glow?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export function BentoCard({ 
  children, 
  className, 
  gradient = false, 
  glow = false,
  onClick,
  hoverable = true
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6',
        'transition-all duration-300',
        hoverable && 'hover:border-white/20 hover:bg-black/50',
        gradient && 'bg-gradient-to-br from-purple-900/20 via-black/40 to-blue-900/20',
        glow && 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]', className)}>
      {children}
    </div>
  );
}

