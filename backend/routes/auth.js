const express = require('express');
const router = express.Router();

// Import auth controller functions (we'll create these next)
const {
  register,
  registerSupplier,
  registerSuperadmin,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/register/supplier', registerSupplier);
router.post('/register/superadmin', registerSuperadmin);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
