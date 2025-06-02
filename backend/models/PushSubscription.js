const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
pushSubscriptionSchema.index({ user: 1, isActive: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

// Static method to create or update subscription
pushSubscriptionSchema.statics.createOrUpdate = async function(userId, subscriptionData) {
  const { endpoint, keys, userAgent } = subscriptionData;
  
  try {
    // Try to find existing subscription by endpoint
    const existingSubscription = await this.findOne({ endpoint });
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.user = userId;
      existingSubscription.keys = keys;
      existingSubscription.userAgent = userAgent;
      existingSubscription.isActive = true;
      existingSubscription.lastUsed = new Date();
      
      await existingSubscription.save();
      return existingSubscription;
    }
    
    // Deactivate old subscriptions for this user
    await this.updateMany(
      { user: userId },
      { isActive: false }
    );
    
    // Create new subscription
    const subscription = new this({
      user: userId,
      endpoint,
      keys,
      userAgent,
      isActive: true,
      lastUsed: new Date()
    });
    
    await subscription.save();
    return subscription;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate endpoint - update existing
      return await this.findOneAndUpdate(
        { endpoint },
        {
          user: userId,
          keys,
          userAgent,
          isActive: true,
          lastUsed: new Date()
        },
        { new: true, upsert: true }
      );
    }
    throw error;
  }
};

// Static method to get active subscriptions for user
pushSubscriptionSchema.statics.getActiveSubscriptions = async function(userId) {
  return await this.find({ user: userId, isActive: true });
};

// Static method to deactivate subscription
pushSubscriptionSchema.statics.deactivateSubscription = async function(userId, endpoint = null) {
  const query = { user: userId };
  if (endpoint) query.endpoint = endpoint;
  
  return await this.updateMany(query, { isActive: false });
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
