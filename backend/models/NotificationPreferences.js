const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },  // SMS notifications disabled - only available through mobile app
  categories: {
    milkDeliveries: {
      type: Boolean,
      default: true
    },
    payments: {
      type: Boolean,
      default: true
    },
    systemUpdates: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    }
  },
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: String,
      default: '22:00'
    },
    endTime: {
      type: String,
      default: '08:00'
    }
  },
  frequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'immediate'
  },
  soundEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to get or create preferences
notificationPreferencesSchema.statics.getOrCreate = async function(userId) {
  let preferences = await this.findOne({ user: userId });
  
  if (!preferences) {
    preferences = new this({
      user: userId,
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
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      frequency: 'immediate',
      soundEnabled: true
    });
    
    await preferences.save();
  }
  
  return preferences;
};

// Method to check if notifications should be sent during quiet hours
notificationPreferencesSchema.methods.isInQuietHours = function() {
  if (!this.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = this.quietHours.startTime.split(':').map(Number);
  const [endHour, endMin] = this.quietHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Method to check if notification category is enabled
notificationPreferencesSchema.methods.isCategoryEnabled = function(category) {
  const categoryMap = {
    'milk_delivery': 'milkDeliveries',
    'payment': 'payments',
    'system': 'systemUpdates',
    'warning': 'systemUpdates',
    'info': 'systemUpdates'
  };
  
  const prefCategory = categoryMap[category] || 'systemUpdates';
  return this.categories[prefCategory] || false;
};

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
