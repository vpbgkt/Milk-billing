import { apiService } from './api';
import type { Notification, NotificationPreferences } from '@/types';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  // Initialize service worker and push notifications
  async initializePushNotifications(): Promise<boolean> {
    try {
      // Check if browser supports service workers and push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.swRegistration = registration;

      // Check if user has granted permission
      let permission = globalThis.Notification.permission;
      if (permission === 'default') {
        permission = await globalThis.Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Get existing subscription or create new one
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: globalThis.PushSubscription): Promise<void> {
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      throw new Error('Failed to get subscription keys');
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
      },
      userAgent: navigator.userAgent
    };

    await apiService.post('/notifications/subscribe', subscriptionData);
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString()
    });
    
    const response = await apiService.get<{
      notifications: Notification[];
      total: number;
      unreadCount: number;
      hasMore: boolean;
    }>(`/notifications?${queryParams.toString()}`);
    
    return response;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await apiService.patch(`/notifications/${notificationId}/read`);
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await apiService.patch('/notifications/read-all');
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await apiService.delete(`/notifications/${notificationId}`);
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiService.get<NotificationPreferences>('/notifications/preferences');
    return response;
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiService.patch<NotificationPreferences>('/notifications/preferences', preferences);
    return response;
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    await apiService.post('/notifications/test');
  }
  // Show browser notification
  showBrowserNotification(title: string, options?: globalThis.NotificationOptions): void {
    if (globalThis.Notification.permission === 'granted') {
      new globalThis.Notification(title, {
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/badge-72x72.svg',
        ...options
      });
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await apiService.delete('/notifications/subscribe');
    }
  }

  // Get push subscription status
  async getSubscriptionStatus(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return !!subscription;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
