'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Notification, NotificationPreferences } from '@/types';
import { notificationService } from '@/services/notifications';
import { mockNotificationService } from '@/services/mockNotifications';
import { useAuth } from './AuthContext';

// Use real notification service now that backend is implemented
const service = notificationService;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  hasMore: boolean;
  isPushEnabled: boolean;
  fetchNotifications: (loadMore?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeNotifications();
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setIsPushEnabled(false);
      setCurrentPage(1);
      setHasMore(true);
    }
  }, [isAuthenticated, user]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      // Initialize push notifications
      const pushEnabled = await service.initializePushNotifications();
      setIsPushEnabled(pushEnabled);

      // Load initial notifications and preferences
      await Promise.all([
        fetchNotifications(),
        loadPreferences()
      ]);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const fetchNotifications = useCallback(async (loadMore = false) => {
    if (isLoading || !isAuthenticated) return;

    try {
      setIsLoading(true);
      const page = loadMore ? currentPage + 1 : 1;
      
      const response = await service.getNotifications(page, 20);
      
      setNotifications(prev => 
        loadMore ? [...prev, ...response.notifications] : response.notifications
      );
      setUnreadCount(response.unreadCount);
      setHasMore(response.hasMore);
      
      if (loadMore) {
        setCurrentPage(page);
      } else {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isAuthenticated, currentPage]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await service.getNotifications(1, 20);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setHasMore(response.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [isAuthenticated]);

  const loadPreferences = async () => {
    try {
      const prefs = await service.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await service.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await service.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await service.deleteNotification(notificationId);
      
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updated = await service.updatePreferences(newPreferences);
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      const enabled = await service.initializePushNotifications();
      setIsPushEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  };

  const disablePushNotifications = async () => {
    try {
      await service.unsubscribe();
      setIsPushEnabled(false);
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    service.showBrowserNotification(title, options);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    hasMore,
    isPushEnabled,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    enablePushNotifications,
    disablePushNotifications,
    showNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
