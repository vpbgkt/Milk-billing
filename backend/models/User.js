const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },  role: {
    type: String,
    enum: ['user', 'supplier', 'superadmin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  // Business fields for suppliers
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    enum: ['dairy_farm', 'distributor', 'cooperative', 'other'],
    default: null
  },
  // Admin fields
  permissions: {
    type: [String],
    default: function() {
      if (this.role === 'superadmin') return ['all'];
      if (this.role === 'supplier') return ['manage_users', 'generate_bills', 'view_analytics'];
      return ['view_profile', 'create_entries'];
    }
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String,
    default: null
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Only for users who are connected to a supplier
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    default: null // For suppliers to invite users
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance (email index is already created by unique: true)
userSchema.index({ supplierId: 1 });
userSchema.index({ inviteCode: 1 });

// Virtual for connected users (for suppliers)
userSchema.virtual('connectedUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'supplierId'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate invite code for suppliers
userSchema.methods.generateInviteCode = function() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  this.inviteCode = code;
  return code;
};

// Method to get user profile without sensitive data
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find users by supplier
userSchema.statics.findBySupplier = function(supplierId) {
  return this.find({ supplierId, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
