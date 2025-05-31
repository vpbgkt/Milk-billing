const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  platformName: {
    type: String,
    default: 'MilkMan',
    maxlength: [50, 'Platform name cannot exceed 50 characters']
  },
  defaultCommission: {
    type: Number,
    default: 5,
    min: [0, 'Commission cannot be negative'],
    max: [50, 'Commission cannot exceed 50%']
  },
  defaultMilkPrice: {
    type: Number,
    default: 60,
    min: [1, 'Milk price must be at least 1']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'System is under maintenance. Please check back later.'
  },
  features: {
    enableNotifications: {
      type: Boolean,
      default: true
    },
    enableBilling: {
      type: Boolean,
      default: true
    },
    enableReports: {
      type: Boolean,
      default: true
    },
    enableMobileApp: {
      type: Boolean,
      default: true
    }
  },
  limits: {
    maxUsersPerSupplier: {
      type: Number,
      default: 100
    },
    maxMilkEntriesPerDay: {
      type: Number,
      default: 10
    },
    maxFileUploadSize: {
      type: Number,
      default: 5 // MB
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    whatsappNotifications: {
      type: Boolean,
      default: true
    }
  },
  branding: {
    logo: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#10B981'
    }
  },
  integrations: {
    twilio: {
      enabled: {
        type: Boolean,
        default: false
      },
      accountSid: {
        type: String,
        default: ''
      },
      authToken: {
        type: String,
        default: ''
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      service: {
        type: String,
        enum: ['gmail', 'sendgrid', 'mailgun'],
        default: 'gmail'
      }
    },
    payment: {
      enabled: {
        type: Boolean,
        default: false
      },
      gateway: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal'],
        default: 'razorpay'
      }
    }
  },
  analytics: {
    trackUserBehavior: {
      type: Boolean,
      default: true
    },
    trackPerformance: {
      type: Boolean,
      default: true
    },
    dataRetentionDays: {
      type: Number,
      default: 365
    }
  },
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    retentionDays: {
      type: Number,
      default: 30
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update settings
platformSettingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
