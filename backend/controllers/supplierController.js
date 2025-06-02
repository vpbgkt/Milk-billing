const User = require('../models/User');
const MilkEntry = require('../models/MilkEntry');
const NotificationService = require('../services/NotificationService');
const crypto = require('crypto');

// @desc    Invite user to connect with supplier
// @route   POST /api/supplier/invite-user
// @access  Private (Supplier only)
exports.inviteUser = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists, check if they're already connected to a supplier
      if (user.supplierId) {
        return res.status(400).json({
          success: false,
          message: 'User is already connected to a supplier'
        });
      }      // Connect existing user to this supplier
      user.supplierId = req.user.id;
      await user.save();

      // Send connection notification to user
      try {
        await NotificationService.sendNotification({
          userId: user._id,
          type: 'system',
          title: 'Connected to Supplier! 🤝',
          message: `You have been connected to ${req.user.name || req.user.businessName}. You can now start tracking your milk deliveries.`,
          priority: 'medium',
          actionUrl: '/dashboard',
          metadata: { 
            action: 'supplier_connected',
            supplierName: req.user.name,
            businessName: req.user.businessName
          }
        });
      } catch (notificationError) {
        console.error('Failed to send connection notification:', notificationError);
        // Don't fail connection if notification fails
      }

      return res.status(200).json({
        success: true,
        message: 'User connected successfully',
        data: user.getPublicProfile()
      });
    }

    // If user doesn't exist, create invitation
    // In a real application, you would send an email invitation
    // For now, we'll create a temporary user record
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    user = await User.create({
      name: name || 'Invited User',
      email,
      password: tempPassword,
      phone: '0000000000', // Temporary phone
      role: 'user',
      supplierId: req.user.id,
      isActive: false, // User needs to activate account
      invitationToken: crypto.randomBytes(32).toString('hex'),      invitedBy: req.user.id
    });

    // Send invitation notification (in real app, this would be email)
    try {
      await NotificationService.sendNotification({
        userId: user._id,
        type: 'system',
        title: 'Supplier Invitation 📧',
        message: `You have been invited by ${req.user.name || req.user.businessName} to track your milk deliveries. Please activate your account.`,
        priority: 'high',
        actionUrl: '/activate-account',
        metadata: { 
          action: 'supplier_invitation',
          supplierName: req.user.name,
          businessName: req.user.businessName,
          invitationToken: user.invitationToken
        }
      });
    } catch (notificationError) {
      console.error('Failed to send invitation notification:', notificationError);
      // Don't fail invitation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'User invitation sent successfully',
      data: {
        email: user.email,
        invitationToken: user.invitationToken,
        tempPassword // In production, this would be sent via email
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all connected users for supplier
// @route   GET /api/supplier/connected-users
// @access  Private (Supplier only)
exports.getConnectedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { supplierId: req.user.id };
    
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const thisMonthEntries = await MilkEntry.countDocuments({
          userId: user._id,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        });

        const totalQuantity = await MilkEntry.aggregate([
          { $match: { userId: user._id, status: 'confirmed' } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        const pendingEntries = await MilkEntry.countDocuments({
          userId: user._id,
          status: 'pending'
        });

        return {
          ...user.toObject(),
          stats: {
            thisMonthEntries,
            totalQuantity: totalQuantity[0]?.total || 0,
            pendingEntries
          }
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: usersWithStats
    });
  } catch (error) {
    console.error('Get connected users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Confirm milk entry
// @route   PUT /api/supplier/confirm-entry/:entryId
// @access  Private (Supplier only)
exports.confirmEntry = async (req, res) => {
  try {
    const entry = await MilkEntry.findById(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Check if this entry belongs to supplier's connected user
    if (entry.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this entry'
      });
    }

    const { quantity, fat, snf, pricePerLiter } = req.body;

    // Update entry with confirmed values
    if (quantity !== undefined) entry.quantity = parseFloat(quantity);
    if (fat !== undefined) entry.fat = parseFloat(fat);
    if (snf !== undefined) entry.snf = parseFloat(snf);
    if (pricePerLiter !== undefined) entry.pricePerLiter = parseFloat(pricePerLiter);

    // Calculate amount
    entry.amount = entry.quantity * entry.pricePerLiter;
    entry.status = 'confirmed';    entry.confirmedAt = new Date();
    entry.confirmedBy = req.user.id;

    await entry.save();
    await entry.populate('userId', 'name email');

    // Send confirmation notification to user
    try {
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN');
      await NotificationService.sendNotification({
        userId: entry.userId._id,
        type: 'milk_delivery',
        title: 'Milk Entry Confirmed ✅',
        message: `Your milk entry for ${entry.quantity}L on ${formattedDate} has been confirmed by ${req.user.name}.`,
        priority: 'medium',
        actionUrl: '/dashboard/milk',
        metadata: { 
          entryId: entry._id,
          action: 'confirmed',
          quantity: entry.quantity,
          date: entry.date,
          supplier: req.user.name,
          amount: entry.amount
        }
      });
    } catch (notificationError) {
      console.error('Failed to send confirmation notification:', notificationError);
      // Don't fail the confirmation if notification fails
    }

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Entry confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Reject milk entry
// @route   PUT /api/supplier/reject-entry/:entryId
// @access  Private (Supplier only)
exports.rejectEntry = async (req, res) => {
  try {
    const entry = await MilkEntry.findById(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (entry.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this entry'
      });
    }

    const { reason } = req.body;    entry.status = 'rejected';
    entry.rejectionReason = reason;
    entry.rejectedAt = new Date();
    entry.rejectedBy = req.user.id;

    await entry.save();
    await entry.populate('userId', 'name email');

    // Send rejection notification to user
    try {
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN');
      await NotificationService.sendNotification({
        userId: entry.userId._id,
        type: 'warning',
        title: 'Milk Entry Rejected ❌',
        message: `Your milk entry for ${entry.quantity}L on ${formattedDate} was rejected by ${req.user.name}. ${reason ? `Reason: ${reason}` : ''}`,
        priority: 'high',
        actionUrl: '/dashboard/milk',
        metadata: { 
          entryId: entry._id,
          action: 'rejected',
          quantity: entry.quantity,
          date: entry.date,
          supplier: req.user.name,
          rejectionReason: reason
        }
      });
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Entry rejected'
    });
  } catch (error) {
    console.error('Reject entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user's milk entry (by supplier)
// @route   PUT /api/supplier/update-entry/:entryId
// @access  Private (Supplier only)
exports.updateUserEntry = async (req, res) => {
  try {
    const entry = await MilkEntry.findById(req.params.entryId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    if (entry.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this entry'
      });
    }

    const { quantity, fat, snf, pricePerLiter, note } = req.body;

    // Update entry fields
    if (quantity !== undefined) entry.quantity = parseFloat(quantity);
    if (fat !== undefined) entry.fat = parseFloat(fat);
    if (snf !== undefined) entry.snf = parseFloat(snf);
    if (pricePerLiter !== undefined) entry.pricePerLiter = parseFloat(pricePerLiter);
    if (note !== undefined) entry.note = note;

    // Recalculate amount
    if (entry.pricePerLiter > 0) {
      entry.amount = entry.quantity * entry.pricePerLiter;
    }    entry.updatedAt = new Date();
    await entry.save();

    await entry.populate('userId', 'name email');

    // Send update notification to user
    try {
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN');
      await NotificationService.sendNotification({
        userId: entry.userId._id,
        type: 'info',
        title: 'Milk Entry Updated 📝',
        message: `Your milk entry for ${formattedDate} has been updated by ${req.user.name}. New quantity: ${entry.quantity}L.`,
        priority: 'medium',
        actionUrl: '/dashboard/milk',
        metadata: { 
          entryId: entry._id,
          action: 'updated',
          quantity: entry.quantity,
          date: entry.date,
          supplier: req.user.name,
          amount: entry.amount
        }
      });
    } catch (notificationError) {
      console.error('Failed to send entry update notification:', notificationError);
      // Don't fail the update if notification fails
    }

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Update user entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Generate bill for user
// @route   POST /api/supplier/generate-bill/:userId
// @access  Private (Supplier only)
exports.generateBill = async (req, res) => {
  try {
    const { month, year } = req.body;
    const userId = req.params.userId;

    // Verify user belongs to this supplier
    const user = await User.findById(userId);
    if (!user || user.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'User not found or not connected to your account'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Get all confirmed entries for the period
    const entries = await MilkEntry.find({
      userId,
      supplierId: req.user.id,
      status: 'confirmed',
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No confirmed entries found for this period'
      });
    }

    // Calculate bill summary
    const billSummary = {
      totalQuantity: 0,
      totalAmount: 0,
      averageFat: 0,
      averageSnf: 0,
      daysSupplied: entries.length,
      averagePrice: 0
    };

    let fatSum = 0, snfSum = 0, fatCount = 0, snfCount = 0;

    entries.forEach(entry => {
      billSummary.totalQuantity += entry.quantity;
      billSummary.totalAmount += entry.amount;
      
      if (entry.fat) {
        fatSum += entry.fat;
        fatCount++;
      }
      
      if (entry.snf) {
        snfSum += entry.snf;
        snfCount++;
      }
    });

    billSummary.averageFat = fatCount > 0 ? (fatSum / fatCount).toFixed(2) : 0;
    billSummary.averageSnf = snfCount > 0 ? (snfSum / snfCount).toFixed(2) : 0;
    billSummary.averagePrice = billSummary.totalQuantity > 0 ? 
      (billSummary.totalAmount / billSummary.totalQuantity).toFixed(2) : 0;

    const bill = {
      billNumber: `BILL-${Date.now()}`,
      supplier: {
        name: req.user.name,
        businessName: req.user.businessName,
        email: req.user.email,
        phone: req.user.phone
      },
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      },
      period: {
        month: month,
        year: year,
        fromDate: startDate.toLocaleDateString(),
        toDate: new Date(endDate.getTime() - 1).toLocaleDateString()
      },
      entries,
      summary: billSummary,
      generatedAt: new Date(),
      generatedBy: req.user.id    };

    // Send billing notification to user
    try {
      const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
      const dueDate = new Date(year, month, 10); // Bills due on 10th of next month
      
      await NotificationService.sendNotification({
        userId: userId,
        type: 'payment',
        title: 'Monthly Bill Ready 💰',
        message: `Your ${monthName} ${year} milk bill of ₹${billSummary.totalAmount.toFixed(2)} is ready. Due date: ${dueDate.toLocaleDateString('en-IN')}.`,
        priority: 'high',
        actionUrl: '/dashboard/billing',
        metadata: { 
          billNumber: bill.billNumber,
          amount: billSummary.totalAmount,
          month: month,
          year: year,
          dueDate: dueDate,
          supplierName: req.user.name,
          totalQuantity: billSummary.totalQuantity
        }
      });
    } catch (notificationError) {
      console.error('Failed to send bill generation notification:', notificationError);
      // Don't fail bill generation if notification fails
    }

    res.status(200).json({
      success: true,
      data: bill,
      message: 'Bill generated successfully'
    });
  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get supplier dashboard stats
// @route   GET /api/supplier/stats
// @access  Private (Supplier only)
exports.getSupplierStats = async (req, res) => {
  try {
    const supplierId = req.user.id;

    // Basic counts
    const totalUsers = await User.countDocuments({ supplierId });
    const activeUsers = await User.countDocuments({ supplierId, isActive: true });
    const pendingEntries = await MilkEntry.countDocuments({ 
      supplierId, 
      status: 'pending' 
    });

    // This month's data
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthEntries = await MilkEntry.countDocuments({
      supplierId,
      createdAt: { $gte: thisMonthStart }
    });

    // Revenue calculation
    const revenueData = await MilkEntry.aggregate([
      { 
        $match: { 
          supplierId: req.user._id, 
          status: 'confirmed',
          createdAt: { $gte: thisMonthStart }
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$amount' },
          totalQuantity: { $sum: '$quantity' }
        } 
      }
    ]);

    // Recent activity
    const recentEntries = await MilkEntry.find({ supplierId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Top users by quantity
    const topUsers = await MilkEntry.aggregate([
      { $match: { supplierId: req.user._id, status: 'confirmed' } },
      { 
        $group: {
          _id: '$userId',
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$amount' },
          entryCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalQuantity: 1,
          totalAmount: 1,
          entryCount: 1
        }
      }
    ]);

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        pendingEntries,
        thisMonthEntries
      },
      revenue: {
        thisMonth: revenueData[0]?.totalRevenue || 0,
        totalQuantity: revenueData[0]?.totalQuantity || 0
      },
      recentEntries,
      topUsers
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove user from supplier connection
// @route   DELETE /api/supplier/remove-user/:userId
// @access  Private (Supplier only)
exports.removeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.supplierId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'User is not connected to your account'
      });
    }

    // Remove supplier connection
    user.supplierId = undefined;
    await user.save();

    // Update related entries to pending status
    await MilkEntry.updateMany(
      { userId: user._id, supplierId: req.user.id, status: 'pending' },
      { status: 'archived' }
    );

    res.status(200).json({
      success: true,
      message: 'User removed from your connections'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Set milk price
// @route   PUT /api/supplier/milk-price
// @access  Private (Supplier only)
exports.setMilkPrice = async (req, res) => {
  try {
    const { price } = req.body;

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const supplier = await User.findById(req.user.id);
    supplier.milkPrice = parseFloat(price);
    await supplier.save();

    res.status(200).json({
      success: true,
      data: {
        milkPrice: supplier.milkPrice
      },
      message: 'Milk price updated successfully'
    });
  } catch (error) {
    console.error('Set milk price error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
