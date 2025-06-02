const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Send response with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      businessName: user.businessName,
      businessType: user.businessType,
      permissions: user.permissions,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      suspensionReason: user.suspensionReason,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      address,
      businessName,
      businessType
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user',
      address,
      businessName,
      businessType
    });

    // Send welcome notification
    try {
      await NotificationService.sendWelcomeNotification(user._id, user.name);
    } catch (notificationError) {
      console.error('Failed to send welcome notification:', notificationError);
      // Don't fail registration if notification fails
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Register supplier
// @route   POST /api/auth/register/supplier
// @access  Public
exports.registerSupplier = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      businessName,
      businessType
    } = req.body;

    // Validate required fields for supplier
    if (!businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required for suppliers'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }    // Create supplier
    const supplier = await User.create({
      name,
      email,
      password,
      phone,
      role: 'supplier',
      address,
      businessName,
      businessType: businessType || 'other'
    });

    // Send welcome notification for supplier
    try {
      await NotificationService.sendNotification({
        userId: supplier._id,
        type: 'system',
        title: 'Welcome to MilkMan Supplier Portal!',
        message: `Hi ${supplier.name}! Welcome to our supplier platform. You can now start managing your milk deliveries and customers.`,
        priority: 'medium',
        actionUrl: '/dashboard',
        metadata: { isWelcome: true, userType: 'supplier' }
      });
    } catch (notificationError) {
      console.error('Failed to send supplier welcome notification:', notificationError);
      // Don't fail registration if notification fails
    }

    sendTokenResponse(supplier, 201, res);
  } catch (error) {
    console.error('Supplier registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during supplier registration'
    });
  }
};

// @desc    Register superadmin (restricted)
// @route   POST /api/auth/register/superadmin
// @access  Private (requires existing superadmin or secret key)
exports.registerSuperadmin = async (req, res) => {
  try {
    const { name, email, password, phone, address, secretKey } = req.body;

    // Check secret key for superadmin registration
    if (secretKey !== process.env.SUPERADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key for superadmin registration'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create superadmin
    const superadmin = await User.create({
      name,
      email,
      password,
      phone,
      role: 'superadmin',
      address,
      permissions: ['all']
    });

    sendTokenResponse(superadmin, 201, res);
  } catch (error) {
    console.error('Superadmin registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during superadmin registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (select password since it's not included by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(401).json({
        success: false,
        message: `Account suspended: ${user.suspensionReason || 'Contact administrator'}`
      });
    }    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address
    };

    // Only allow business fields for suppliers
    if (req.user.role === 'supplier') {
      fieldsToUpdate.businessName = req.body.businessName;
      fieldsToUpdate.businessType = req.body.businessType;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update password
// @route   POST /api/auth/change-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Implement email sending functionality
    // For now, just return success message
    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // TODO: Implement password reset with token validation
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    // TODO: Implement email verification
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
