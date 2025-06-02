'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Truck,
  Bell,
  Settings,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';

interface NavigationItem {
  name: string;
  icon: React.ElementType;
  href?: string | null;
  badge?: number | null;
  action?: () => void;
}

interface BottomNavigationProps {
  onMenuToggle: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onMenuToggle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      badge: null
    },
    { 
      name: 'Users', 
      href: '/dashboard/users', 
      icon: Users,
      badge: null
    },
    { 
      name: 'Menu', 
      href: null, 
      icon: Menu,
      badge: null,
      action: onMenuToggle
    },
    { 
      name: 'Notifications', 
      href: '/dashboard/notifications', 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings,
      badge: null
    },  ];

  const handleNavigation = (item: NavigationItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = item.href && pathname === item.href;
          const Icon = item.icon;
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex flex-col items-center justify-center p-2 min-h-[60px] flex-1 relative',
                'touch-manipulation transition-colors duration-200',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-blue-600'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  className={cn(
                    'transition-transform duration-200',
                    'active:scale-95'
                  )} 
                />
                
                {/* Badge for notifications */}
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold min-w-[20px]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              <span className={cn(
                'text-xs mt-1 font-medium transition-colors duration-200',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}>
                {item.name}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
