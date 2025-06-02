const User = require('../models/User');
const MilkEntry = require('../models/MilkEntry');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('supplierId', 'name businessName')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      fieldsToUpdate, 
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user's milk entry history
// @route   GET /api/users/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { userId: req.user.id };
    
    if (req.query.month && req.query.year) {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month) - 1; // JavaScript months are 0-indexed
      
      filter.date = {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1)
      };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const entries = await MilkEntry.find(filter)
      .populate('supplierId', 'name businessName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MilkEntry.countDocuments(filter);

    // Calculate summary statistics
    const totalQuantity = await MilkEntry.aggregate([
      { $match: { userId: req.user.id, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const totalAmount = await MilkEntry.aggregate([
      { $match: { userId: req.user.id, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const summary = {
      totalQuantity: totalQuantity[0]?.total || 0,
      totalAmount: totalAmount[0]?.total || 0,
      totalEntries: await MilkEntry.countDocuments({ userId: req.user.id }),
      confirmedEntries: await MilkEntry.countDocuments({ userId: req.user.id, status: 'confirmed' }),
      pendingEntries: await MilkEntry.countDocuments({ userId: req.user.id, status: 'pending' })
    };

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      summary,
      data: entries
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    // This is a placeholder implementation
    // In a real application, you would handle file upload here
    // using multer or similar middleware
    
    res.status(200).json({
      success: true,
      message: 'Profile picture upload functionality will be implemented',
      data: {
        message: 'File upload feature coming soon'
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate account instead of permanent deletion
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    // Update related milk entries to archived status
    await MilkEntry.updateMany(
      { userId: req.user.id },
      { status: 'archived' }
    );

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
