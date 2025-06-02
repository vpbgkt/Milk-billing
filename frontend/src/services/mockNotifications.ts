import type { Notification, NotificationPreferences } from '@/types';

// Mock notification data for testing
const mockNotifications: Notification[] = [
  {
    _id: '1',
    user: 'user1',
    type: 'milk_delivery',
    title: 'Milk Delivery Completed',
    message: 'Your daily milk delivery of 5 liters has been completed successfully.',
    priority: 'medium',
    isRead: false,
    actionUrl: '/dashboard/deliveries',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    _id: '2',
    user: 'user1',
    type: 'payment',
    title: 'Payment Due',
    message: 'Your monthly payment of ₹1,500 is due in 3 days.',
    priority: 'high',
    isRead: false,
    actionUrl: '/dashboard/payments',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '3',
    user: 'user1',
    type: 'success',
    title: 'Profile Updated',
    message: 'Your profile information has been updated successfully.',
    priority: 'low',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: '4',
    user: 'user1',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Milk stock is running low. Please restock within 2 days.',
    priority: 'urgent',
    isRead: false,
    actionUrl: '/dashboard/inventory',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    _id: '5',
    user: 'user1',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 11 PM to 1 AM.',
    priority: 'medium',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockPreferences: NotificationPreferences = {
  _id: 'pref1',
  user: 'user1',
  emailNotifications: true,
  pushNotifications: true,
  // SMS notifications disabled - only available through mobile app
  categories: {
    milkDeliveries: true,
    payments: true,
    systemUpdates: true,
    marketing: false
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

class MockNotificationService {
  private notifications: Notification[] = [...mockNotifications];
  private preferences: NotificationPreferences = { ...mockPreferences };

  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = unreadOnly 
      ? this.notifications.filter(n => !n.isRead)
      : this.notifications;
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNotifications = filtered.slice(start, end);
    
    return {
      notifications: paginatedNotifications,
      total: filtered.length,
      unreadCount: this.notifications.filter(n => !n.isRead).length,
      hasMore: end < filtered.length
    };
  }

  async markAsRead(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const notification = this.notifications.find(n => n._id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
    }
  }

  async markAllAsRead(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.notifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        notification.updatedAt = new Date().toISOString();
      }
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.notifications = this.notifications.filter(n => n._id !== notificationId);
  }

  async getPreferences(): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { ...this.preferences };
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.preferences = {
      ...this.preferences,
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    
    return { ...this.preferences };
  }

  async sendTestNotification(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const testNotification: Notification = {
      _id: `test-${Date.now()}`,
      user: 'user1',
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.notifications.unshift(testNotification);
    
    // Show browser notification if permissions are granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(testNotification.title, {
        body: testNotification.message,
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/badge-72x72.svg'
      });
    }
  }
  // Mock push notification methods
  async initializePushNotifications(): Promise<boolean> {
    // In a real app, this would register service worker and request permissions
    console.log('Mock: Initializing push notifications');
    return true;
  }

  async getSubscriptionStatus(): Promise<boolean> {
    return true; // Mock enabled status
  }

  async unsubscribe(): Promise<void> {
    console.log('Mock: Unsubscribing from push notifications');
  }

  showBrowserNotification(title: string, options?: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/badge-72x72.svg',
        ...options
      });
    }
  }
}

// Use mock service in development/testing
export const mockNotificationService = new MockNotificationService();

// Auto-generate new notifications periodically (for demo)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const demoNotifications = [
      {
        type: 'milk_delivery' as const,
        title: 'New Delivery Scheduled',
        message: 'Your milk delivery has been scheduled for tomorrow morning.',
        priority: 'medium' as const
      },
      {
        type: 'payment' as const,
        title: 'Payment Received',
        message: 'Payment of ₹500 has been received successfully.',
        priority: 'low' as const
      },
      {
        type: 'info' as const,
        title: 'Weather Update',
        message: 'Delivery may be delayed due to heavy rain expected.',
        priority: 'medium' as const
      }
    ];
    
    const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];
    const newNotification: Notification = {
      _id: `demo-${Date.now()}`,
      user: 'user1',
      ...randomNotification,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // This would trigger through the context in a real implementation
    console.log('Demo notification generated:', newNotification);
  }, 60000); // Every minute
}
