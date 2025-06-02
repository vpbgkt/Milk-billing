const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const MilkEntry = require('../models/MilkEntry');
const PlatformSettings = require('../models/PlatformSettings');

// @desc    Get platform analytics
// @route   GET /api/superadmin/analytics
// @access  Private (SuperAdmin only)
router.get('/analytics', protect, authorize('superadmin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSuppliers = await User.countDocuments({ role: 'supplier' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
      const totalMilkEntries = await MilkEntry.countDocuments();
    const thisMonthEntries = await MilkEntry.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // Calculate total revenue from confirmed entries
    const revenueData = await MilkEntry.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Calculate monthly growth (comparing with previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const lastMonthUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    const lastMonthSuppliers = await User.countDocuments({
      role: 'supplier',
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthSuppliers = await User.countDocuments({
      role: 'supplier',
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    const lastMonthRevenue = await MilkEntry.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
        } 
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const thisMonthRevenue = await MilkEntry.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        } 
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    // Get recent activities
    const recentActivities = await getRecentActivities();

    const platformStats = {
      totalUsers,
      totalSuppliers,
      totalMilkEntries,
      totalRevenue,
      monthlyGrowth: {
        users: lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100) : 0,
        suppliers: lastMonthSuppliers > 0 ? ((thisMonthSuppliers - lastMonthSuppliers) / lastMonthSuppliers * 100) : 0,
        revenue: (lastMonthRevenue[0]?.totalRevenue || 0) > 0 ? 
          (((thisMonthRevenue[0]?.totalRevenue || 0) - (lastMonthRevenue[0]?.totalRevenue || 0)) / (lastMonthRevenue[0]?.totalRevenue || 0) * 100) : 0
      },
      recentActivities,
      // Keep legacy structure for backward compatibility
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers
      },
      suppliers: {
        total: totalSuppliers
      },
      milkEntries: {
        total: totalMilkEntries,
        thisMonth: thisMonthEntries
      }
    };

    res.status(200).json({
      success: true,
      data: platformStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get all suppliers with their stats
// @route   GET /api/superadmin/suppliers
// @access  Private (SuperAdmin only)
router.get('/suppliers', protect, authorize('superadmin'), async (req, res) => {
  try {
    const suppliers = await User.find({ role: 'supplier' })
      .populate('connectedUsers')
      .select('-password');

    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier) => {
        const userCount = await User.countDocuments({ supplierId: supplier._id });
        const milkEntriesCount = await MilkEntry.countDocuments({ supplierId: supplier._id });
        const thisMonthRevenue = await calculateSupplierRevenue(supplier._id);

        return {
          ...supplier.toObject(),
          stats: {
            connectedUsers: userCount,
            totalMilkEntries: milkEntriesCount,
            thisMonthRevenue
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: suppliersWithStats.length,
      data: suppliersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get all users across platform
// @route   GET /api/superadmin/users
// @access  Private (SuperAdmin only)
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { role: 'user' };
    if (req.query.supplier) {
      filter.supplierId = req.query.supplier;
    }
    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }

    const users = await User.find(filter)
      .populate('supplierId', 'name businessName')
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Suspend/Unsuspend user or supplier
// @route   PUT /api/superadmin/users/:id/suspend
// @access  Private (SuperAdmin only)
router.put('/users/:id/suspend', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { suspend, reason } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isSuspended = suspend;
    if (suspend) {
      user.isActive = false;
    }
    
    await user.save();

    // Log the action
    console.log(`User ${user.email} ${suspend ? 'suspended' : 'unsuspended'} by SuperAdmin. Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      data: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete user or supplier
// @route   DELETE /api/superadmin/users/:id
// @access  Private (SuperAdmin only)
router.delete('/users/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If deleting a supplier, handle connected users
    if (user.role === 'supplier') {
      await User.updateMany(
        { supplierId: user._id },
        { $unset: { supplierId: 1 }, isActive: false }
      );
      
      // Also handle milk entries
      await MilkEntry.updateMany(
        { supplierId: user._id },
        { status: 'archived' }
      );
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create new supplier
// @route   POST /api/superadmin/suppliers
// @access  Private (SuperAdmin only)
router.post('/suppliers', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, email, password, businessName, phone, address, commission } = req.body;    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const supplier = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'supplier',
      businessName,
      commission: commission || 0,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier.getPublicProfile()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update platform settings
// @route   PUT /api/superadmin/settings
// @access  Private (SuperAdmin only)
router.put('/settings', protect, authorize('superadmin'), async (req, res) => {
  try {
    // This would typically update a settings collection
    // For now, we'll return a success message
    const { platformName, defaultCommission, maintenanceMode } = req.body;

    // Here you would update platform settings in database
    // const settings = await Settings.findOneAndUpdate({}, {
    //   platformName,
    //   defaultCommission,
    //   maintenanceMode
    // }, { upsert: true, new: true });

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: {
        platformName,
        defaultCommission,
        maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Helper function to get recent activities
async function getRecentActivities() {
  const recentUsers = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email createdAt');
  
  const recentSuppliers = await User.find({ role: 'supplier' })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('name businessName createdAt');
  
  const recentEntries = await MilkEntry.find()
    .populate('userId', 'name')
    .populate('supplierId', 'name businessName')
    .sort({ createdAt: -1 })
    .limit(10);

  const activities = [];

  // Add user registrations
  recentUsers.forEach(user => {
    activities.push({
      _id: `user-${user._id}`,
      type: 'user_registration',
      description: `New user ${user.name} registered`,
      user: user._id,
      createdAt: user.createdAt
    });
  });

  // Add supplier registrations
  recentSuppliers.forEach(supplier => {
    activities.push({
      _id: `supplier-${supplier._id}`,
      type: 'supplier_registration',
      description: `New supplier ${supplier.businessName || supplier.name} registered`,
      user: supplier._id,
      createdAt: supplier.createdAt
    });
  });

  // Add milk deliveries
  recentEntries.forEach(entry => {
    activities.push({
      _id: `entry-${entry._id}`,
      type: 'milk_delivery',
      description: `${entry.userId?.name || 'User'} recorded ${entry.quantity}L milk delivery`,
      user: entry.userId?._id,
      createdAt: entry.createdAt
    });
  });

  // Sort by date and return top 20
  return activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
}

// Helper function to get registration trend
async function getRegistrationTrend() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const registrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo },
        role: { $in: ['user', 'supplier'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          role: '$role'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return registrations;
}

// Helper function to calculate supplier revenue
async function calculateSupplierRevenue(supplierId) {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const milkEntries = await MilkEntry.find({
    supplierId,
    createdAt: { $gte: thisMonth },
    status: 'confirmed'
  });

  // Assuming each milk entry has a price or you have a default price
  const defaultPricePerKg = 60; // This should come from settings
  const totalRevenue = milkEntries.reduce((sum, entry) => {
    return sum + (entry.quantity * defaultPricePerKg);
  }, 0);

  return totalRevenue;
}

module.exports = router;
