import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  mobileFullScreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  mobileFullScreen = false
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift on desktop
      if (window.innerWidth > 768) {
        document.body.style.paddingRight = '17px';
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const mobileClasses = mobileFullScreen 
    ? 'md:rounded-lg md:mx-4 mx-0 rounded-none h-full md:h-auto md:max-h-[90vh] flex flex-col'
    : 'mx-4 rounded-lg max-h-[90vh] flex flex-col';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative bg-white shadow-xl w-full overflow-hidden',
        sizeClasses[size],
        mobileClasses,
        'safe-area-top safe-area-bottom',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 flex-shrink-0"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
