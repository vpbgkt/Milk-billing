const webpush = require('web-push');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const NotificationPreferences = require('../models/NotificationPreferences');

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@milkman.com';

let pushNotificationsEnabled = false;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    pushNotificationsEnabled = true;
    console.log('✅ Push notifications enabled with VAPID keys');
  } catch (error) {
    console.warn('❌ Invalid VAPID keys. Push notifications disabled:', error.message);
    pushNotificationsEnabled = false;
  }
} else {
  console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
}

class NotificationService {
  /**
   * Send notification to user(s)
   * @param {Object} options - Notification options
   * @param {string|Array} options.userId - User ID or array of user IDs
   * @param {string} options.type - Notification type
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.priority - Notification priority
   * @param {string} options.actionUrl - Optional action URL
   * @param {Object} options.metadata - Additional metadata
   * @param {boolean} options.sendPush - Whether to send push notification
   * @param {Date} options.expiresAt - Expiration date
   */
  static async sendNotification(options) {
    const {
      userId,
      type,
      title,
      message,
      priority = 'medium',
      actionUrl = null,
      metadata = {},
      sendPush = true,
      expiresAt = null
    } = options;

    const userIds = Array.isArray(userId) ? userId : [userId];
    const results = [];

    for (const uid of userIds) {
      try {
        // Check user preferences
        const preferences = await NotificationPreferences.getOrCreate(uid);
        
        // Skip if notification category is disabled
        if (!preferences.isCategoryEnabled(type)) {
          continue;
        }

        // Skip during quiet hours for non-urgent notifications
        if (priority !== 'urgent' && preferences.isInQuietHours()) {
          // Schedule for later or skip
          continue;
        }

        // Create database notification
        const notification = await Notification.createNotification({
          user: uid,
          type,
          title,
          message,
          priority,
          actionUrl,
          metadata,
          expiresAt
        });

        // Send push notification if enabled
        if (sendPush && preferences.pushNotifications) {
          await this.sendPushNotification(uid, {
            title,
            message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            data: {
              notificationId: notification._id,
              actionUrl,
              type,
              priority
            },
            tag: type,
            requireInteraction: priority === 'urgent',
            actions: this.getNotificationActions(type)
          });
        }

        results.push({
          userId: uid,
          notificationId: notification._id,
          success: true
        });

      } catch (error) {
        console.error(`Failed to send notification to user ${uid}:`, error);
        results.push({
          userId: uid,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
  /**
   * Send push notification to user
   */
  static async sendPushNotification(userId, payload) {
    try {
      // Check if push notifications are enabled
      if (!pushNotificationsEnabled) {
        console.log('Push notifications disabled - skipping push notification');
        return;
      }

      const subscriptions = await PushSubscription.getActiveSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return;
      }

      const pushPromises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          };

          const pushPayload = JSON.stringify(payload);
          
          await webpush.sendNotification(pushSubscription, pushPayload);
          
          // Update last used timestamp
          subscription.lastUsed = new Date();
          await subscription.save();

        } catch (error) {
          console.error(`Failed to send push notification:`, error);
          
          // Deactivate invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            subscription.isActive = false;
            await subscription.save();
          }
        }
      });

      await Promise.allSettled(pushPromises);
    } catch (error) {
      console.error('Push notification service error:', error);
    }
  }

  /**
   * Get notification actions based on type
   */
  static getNotificationActions(type) {
    const actions = {
      milk_delivery: [
        { action: 'view', title: 'View Details' },
        { action: 'confirm', title: 'Confirm' }
      ],
      payment: [
        { action: 'view', title: 'View Bill' },
        { action: 'pay', title: 'Pay Now' }
      ],
      system: [
        { action: 'view', title: 'View' }
      ],
      warning: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      info: [
        { action: 'view', title: 'View' }
      ]
    };

    return actions[type] || actions.info;
  }

  /**
   * Send welcome notification to new user
   */
  static async sendWelcomeNotification(userId, userName) {
    return await this.sendNotification({
      userId,
      type: 'system',
      title: 'Welcome to MilkMan!',
      message: `Hi ${userName}! Welcome to our milk delivery platform. Start tracking your daily milk consumption today.`,
      priority: 'medium',
      actionUrl: '/dashboard',
      metadata: { isWelcome: true }
    });
  }
  /**
   * Send milk delivery notification
   */
  static async sendMilkDeliveryNotification(userId, deliveryData) {
    const { quantity, deliveryDate, supplier } = deliveryData;
    
    return await this.sendNotification({
      userId,
      type: 'milk_delivery',
      title: 'Milk Delivered',
      message: `${quantity}L of milk has been delivered by ${supplier.name} on ${deliveryDate}.`,
      priority: 'medium',
      actionUrl: '/dashboard/milk',
      metadata: { deliveryData }
    });
  }

  /**
   * Send entry confirmation notification
   */
  static async sendEntryConfirmedNotification(userId, entryData) {
    const { quantity, date, supplierName, amount } = entryData;
    const formattedDate = new Date(date).toLocaleDateString('en-IN');
    
    return await this.sendNotification({
      userId,
      type: 'milk_delivery',
      title: 'Entry Confirmed ✅',
      message: `Your milk entry for ${quantity}L on ${formattedDate} has been confirmed by ${supplierName}. Amount: ₹${amount.toFixed(2)}`,
      priority: 'medium',
      actionUrl: '/dashboard/milk',
      metadata: { entryData, action: 'confirmed' }
    });
  }

  /**
   * Send entry rejection notification
   */
  static async sendEntryRejectedNotification(userId, entryData) {
    const { quantity, date, supplierName, reason } = entryData;
    const formattedDate = new Date(date).toLocaleDateString('en-IN');
    
    return await this.sendNotification({
      userId,
      type: 'warning',
      title: 'Entry Rejected ❌',
      message: `Your milk entry for ${quantity}L on ${formattedDate} was rejected by ${supplierName}. ${reason ? `Reason: ${reason}` : ''}`,
      priority: 'high',
      actionUrl: '/dashboard/milk',
      metadata: { entryData, action: 'rejected' }
    });
  }

  /**
   * Send pending entry notification to supplier
   */
  static async sendPendingEntryNotification(supplierId, entryData) {
    const { quantity, date, userName } = entryData;
    const formattedDate = new Date(date).toLocaleDateString('en-IN');
    
    return await this.sendNotification({
      userId: supplierId,
      type: 'milk_delivery',
      title: 'New Entry Pending 📝',
      message: `${userName} added a milk entry for ${quantity}L on ${formattedDate}. Please review and confirm.`,
      priority: 'medium',
      actionUrl: '/supplier/entries',
      metadata: { entryData, action: 'pending_review' }
    });
  }
  /**
   * Send payment notification
   */
  static async sendPaymentNotification(userId, paymentData) {
    const { amount, dueDate, billId } = paymentData;
    
    return await this.sendNotification({
      userId,
      type: 'payment',
      title: 'Payment Due',
      message: `Your monthly milk bill of ₹${amount} is due on ${dueDate}.`,
      priority: 'high',
      actionUrl: `/dashboard/billing/${billId}`,
      metadata: { paymentData }
    });
  }

  /**
   * Send bill generated notification
   */
  static async sendBillGeneratedNotification(userId, billData) {
    const { amount, month, year, supplierName, dueDate } = billData;
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    
    return await this.sendNotification({
      userId,
      type: 'payment',
      title: 'Monthly Bill Generated 💰',
      message: `Your ${monthName} ${year} milk bill of ₹${amount.toFixed(2)} has been generated by ${supplierName}. Due: ${dueDate}`,
      priority: 'high',
      actionUrl: '/dashboard/billing',
      metadata: { billData }
    });
  }

  /**
   * Send payment reminder notification
   */
  static async sendPaymentReminderNotification(userId, reminderData) {
    const { amount, daysLeft, billNumber } = reminderData;
    
    const priority = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'high' : 'medium';
    const title = daysLeft <= 1 ? 'Payment Overdue!' : `Payment Due in ${daysLeft} days`;
    
    return await this.sendNotification({
      userId,
      type: 'payment',
      title,
      message: `Your milk bill of ₹${amount.toFixed(2)} (${billNumber}) is ${daysLeft <= 0 ? 'overdue' : `due in ${daysLeft} days`}. Please pay soon.`,
      priority,
      actionUrl: '/dashboard/billing',
      metadata: { reminderData, isReminder: true }
    });
  }

  /**
   * Send urgent notification (system issues, important updates)
   */
  static async sendUrgentNotification(userId, title, message, actionUrl = null) {
    return await this.sendNotification({
      userId,
      type: 'warning',
      title,
      message,
      priority: 'urgent',
      actionUrl,
      metadata: { isUrgent: true }
    });
  }
  /**
   * Send bulk notification to multiple users
   */
  static async sendBulkNotification(userIds, notificationData) {
    return await this.sendNotification({
      userId: userIds,
      ...notificationData
    });
  }

  /**
   * Send daily summary notification to user
   */
  static async sendDailySummaryNotification(userId, summaryData) {
    const { totalQuantity, entriesCount, todayDate } = summaryData;
    
    return await this.sendNotification({
      userId,
      type: 'info',
      title: 'Daily Milk Summary 📊',
      message: `Today's milk consumption: ${totalQuantity}L across ${entriesCount} ${entriesCount === 1 ? 'entry' : 'entries'}.`,
      priority: 'low',
      actionUrl: '/dashboard/milk',
      metadata: { summaryData, type: 'daily_summary' }
    });
  }

  /**
   * Send weekly summary notification to supplier
   */
  static async sendWeeklySummaryNotification(supplierId, summaryData) {
    const { totalUsers, totalQuantity, totalRevenue, weekStart, weekEnd } = summaryData;
    
    return await this.sendNotification({
      userId: supplierId,
      type: 'info',
      title: 'Weekly Business Summary 📈',
      message: `This week: ${totalUsers} customers, ${totalQuantity}L delivered, ₹${totalRevenue.toFixed(2)} revenue.`,
      priority: 'medium',
      actionUrl: '/supplier/dashboard',
      metadata: { summaryData, type: 'weekly_summary' }
    });
  }

  /**
   * Send low stock alert (future feature)
   */
  static async sendLowStockAlert(supplierId, alertData) {
    const { itemName, currentStock, threshold } = alertData;
    
    return await this.sendNotification({
      userId: supplierId,
      type: 'warning',
      title: 'Low Stock Alert ⚠️',
      message: `${itemName} is running low (${currentStock} remaining, threshold: ${threshold}). Please restock soon.`,
      priority: 'high',
      actionUrl: '/supplier/inventory',
      metadata: { alertData, type: 'stock_alert' }
    });
  }

  /**
   * Send system maintenance notification
   */
  static async sendMaintenanceNotification(userIds, maintenanceData) {
    const { startTime, endTime, reason } = maintenanceData;
    
    return await this.sendBulkNotification(userIds, {
      type: 'system',
      title: 'System Maintenance Scheduled 🔧',
      message: `Scheduled maintenance from ${startTime} to ${endTime}. ${reason}`,
      priority: 'medium',
      actionUrl: '/notifications',
      metadata: { maintenanceData, type: 'maintenance' }
    });
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      console.log(`Cleaned up ${result.deletedCount} expired notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
      return 0;
    }
  }
  /**
   * Get notification statistics
   */
  static async getNotificationStats(userId) {
    const stats = await Notification.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              priority: '$priority',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);

    return stats[0] || { total: 0, unread: 0, byType: [] };
  }
}

module.exports = NotificationService;
