'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

interface MobileCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileCardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileCardBadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

interface MobileCardIconProps {
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const MobileCard: React.FC<MobileCardProps> = ({ 
  children, 
  className, 
  onClick, 
  selected = false 
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 shadow-sm',
        'transition-all duration-200 touch-manipulation',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
        selected && 'ring-2 ring-blue-500 border-blue-300',
        className
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </div>
  );
};

const MobileCardHeader: React.FC<MobileCardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-start justify-between mb-3', className)}>
      {children}
    </div>
  );
};

const MobileCardContent: React.FC<MobileCardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

const MobileCardActions: React.FC<MobileCardActionsProps> = ({ children, className }) => {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-100', className)}>
      {children}
    </div>
  );
};

const MobileCardBadge: React.FC<MobileCardBadgeProps> = ({ 
  text, 
  variant = 'default', 
  className 
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={cn(
      'px-2 py-1 text-xs font-semibold rounded-full',
      variantStyles[variant],
      className
    )}>
      {text}
    </span>
  );
};

const MobileCardIcon: React.FC<MobileCardIconProps> = ({ 
  icon: Icon, 
  variant = 'default', 
  className 
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className={cn(
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
      variantStyles[variant],
      className
    )}>
      <Icon size={20} />
    </div>
  );
};

export {
  MobileCard,
  MobileCardHeader,
  MobileCardContent,
  MobileCardActions,
  MobileCardBadge,
  MobileCardIcon
};
