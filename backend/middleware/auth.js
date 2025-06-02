const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized to access this route.`
      });
    }

    next();
  };
};

// Check if user is supplier
const isSupplier = (req, res, next) => {
  if (req.user && req.user.role === 'supplier') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Supplier access required.'
    });
  }
};

// Check if user is regular user or supplier accessing their own data
const isOwnerOrSupplier = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.params.id;
    
    // If user is accessing their own data
    if (req.user._id.toString() === userId) {
      return next();
    }

    // If user is a supplier accessing their connected user's data
    if (req.user.role === 'supplier') {
      const targetUser = await User.findById(userId);
      if (targetUser && targetUser.supplierId && targetUser.supplierId.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.'
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we continue without user
        console.log('Optional auth - invalid token');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  protect,
  authorize,
  isSupplier,
  isOwnerOrSupplier,
  optionalAuth
};
