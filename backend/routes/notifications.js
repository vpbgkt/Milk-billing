const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const NotificationPreferences = require('../models/NotificationPreferences');
const NotificationService = require('../services/NotificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per request
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const result = await Notification.getUserNotifications(req.user.id, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.user.id, req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const preferences = await NotificationPreferences.getOrCreate(req.user.id);

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message
    });
  }
});

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
router.patch('/preferences', protect, async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      smsNotifications,
      categories,
      quietHours,
      frequency,
      soundEnabled
    } = req.body;

    let preferences = await NotificationPreferences.findOne({ user: req.user.id });
    
    if (!preferences) {
      preferences = await NotificationPreferences.getOrCreate(req.user.id);
    }

    // Update preferences
    if (emailNotifications !== undefined) preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
    if (smsNotifications !== undefined) preferences.smsNotifications = smsNotifications;
    if (categories) preferences.categories = { ...preferences.categories, ...categories };
    if (quietHours) preferences.quietHours = { ...preferences.quietHours, ...quietHours };
    if (frequency !== undefined) preferences.frequency = frequency;
    if (soundEnabled !== undefined) preferences.soundEnabled = soundEnabled;

    await preferences.save();

    res.status(200).json({
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
});

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    const subscription = await PushSubscription.createOrUpdate(req.user.id, {
      endpoint,
      keys,
      userAgent: userAgent || req.get('User-Agent') || ''
    });

    res.status(200).json({
      success: true,
      data: { subscriptionId: subscription._id },
      message: 'Push notification subscription saved successfully'
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription',
      error: error.message
    });
  }
});

// @desc    Unsubscribe from push notifications
// @route   DELETE /api/notifications/subscribe
// @access  Private
router.delete('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushSubscription.deactivateSubscription(req.user.id, endpoint);

    res.status(200).json({
      success: true,
      message: 'Push notification subscription removed successfully'
    });
  } catch (error) {
    console.error('Push unsubscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push subscription',
      error: error.message
    });
  }
});

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const { title, message, type = 'info', priority = 'medium' } = req.body;

    const result = await NotificationService.sendNotification({
      userId: req.user.id,
      type,
      title: title || 'Test Notification',
      message: message || 'This is a test notification to verify the system is working correctly.',
      priority,
      actionUrl: '/dashboard/notifications',
      metadata: { isTest: true }
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStats(req.user.id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
});

// @desc    Get push subscription status
// @route   GET /api/notifications/subscription-status
// @access  Private
router.get('/subscription-status', protect, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.getActiveSubscriptions(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        hasActiveSubscription: subscriptions.length > 0,
        subscriptionCount: subscriptions.length,
        subscriptions: subscriptions.map(sub => ({
          endpoint: sub.endpoint,
          userAgent: sub.userAgent,
          lastUsed: sub.lastUsed,
          createdAt: sub.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status',
      error: error.message
    });  }
});

// @desc    Get VAPID public key for push notifications
// @route   GET /api/notifications/vapid-public-key
// @access  Public
router.get('/vapid-public-key', (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      return res.status(500).json({
        success: false,
        message: 'VAPID public key not configured'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        publicKey: vapidPublicKey
      }
    });
  } catch (error) {
    console.error('Get VAPID public key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID public key',
      error: error.message
    });
  }
});

module.exports = router;
