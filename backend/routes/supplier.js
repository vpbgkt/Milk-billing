const express = require('express');
const router = express.Router();

// Import supplier controller functions
const {
  inviteUser,
  getConnectedUsers,
  confirmEntry,
  rejectEntry,
  generateBill,
  getSupplierStats,
  updateUserEntry,
  removeUser,
  setMilkPrice
} = require('../controllers/supplierController');

const { protect, isSupplier } = require('../middleware/auth');

// All routes require supplier authentication
router.use(protect);
router.use(isSupplier);

// User management
router.post('/invite-user', inviteUser);
router.get('/connected-users', getConnectedUsers);
router.delete('/remove-user/:userId', removeUser);

// Entry management
router.put('/confirm-entry/:entryId', confirmEntry);
router.put('/reject-entry/:entryId', rejectEntry);
router.put('/update-entry/:entryId', updateUserEntry);

// Billing and reporting
router.post('/generate-bill/:userId', generateBill);
router.get('/stats', getSupplierStats);

// Pricing
router.put('/milk-price', setMilkPrice);

module.exports = router;
