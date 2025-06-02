const express = require('express');
const router = express.Router();

// Import user controller functions
const {
  getProfile,
  updateProfile,
  getHistory,
  uploadProfilePicture,
  deleteAccount
} = require('../controllers/userController');

const { protect, isOwnerOrSupplier } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/picture', uploadProfilePicture);

// User history and data
router.get('/history', getHistory);

// Account management
router.delete('/account', deleteAccount);

module.exports = router;
