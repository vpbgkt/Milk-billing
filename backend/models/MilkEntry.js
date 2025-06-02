const mongoose = require('mongoose');

const milkEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional - users can make independent entries
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    max: [50, 'Quantity cannot exceed 50 liters'],
    default: 0
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'rejected'],
    default: 'confirmed'
  },
  entryType: {
    type: String,
    enum: ['supplier_entry', 'user_request'],
    default: 'supplier_entry'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  pricePerUnit: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  deliveryTime: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'morning'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [100, 'Rejection reason cannot exceed 100 characters']
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
milkEntrySchema.index({ userId: 1, date: -1 });
milkEntrySchema.index({ supplierId: 1, date: -1 });
milkEntrySchema.index({ status: 1 });
milkEntrySchema.index({ date: 1 });

// Compound index for efficient querying
milkEntrySchema.index({ userId: 1, supplierId: 1, date: -1 });

// Virtual for formatted date
milkEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Pre-save middleware to calculate total amount
milkEntrySchema.pre('save', function(next) {
  if (this.isModified('quantity') || this.isModified('pricePerUnit')) {
    this.totalAmount = this.quantity * this.pricePerUnit;
  }
  next();
});

// Pre-save middleware to set confirmation details
milkEntrySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

// Static method to get monthly summary for a user
milkEntrySchema.statics.getMonthlySum = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        status: 'confirmed'
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalAmount: { $sum: '$totalAmount' },
        entryCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalQuantity: 0, totalAmount: 0, entryCount: 0 };
};

// Static method to get daily entries for a month
milkEntrySchema.statics.getMonthlyEntries = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Static method to get pending entries for a supplier
milkEntrySchema.statics.getPendingEntries = function(supplierId) {
  return this.find({
    supplierId,
    status: 'pending'
  })
  .populate('userId', 'name email phone')
  .sort({ createdAt: -1 });
};

// Static method to check if entry exists for a specific date and user
milkEntrySchema.statics.checkExistingEntry = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
};

// Instance method to approve entry
milkEntrySchema.methods.approve = function(confirmedBy) {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.confirmedBy = confirmedBy;
  return this.save();
};

// Instance method to reject entry
milkEntrySchema.methods.reject = function(reason, rejectedBy) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.confirmedBy = rejectedBy;
  return this.save();
};

module.exports = mongoose.model('MilkEntry', milkEntrySchema);
