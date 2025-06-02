const express = require('express');
const router = express.Router();

const {
  generateMonthlyBill,
  getBillingSummary,
  getUserBillHistory
} = require('../controllers/billingController');

const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and supplier role
router.use(protect);
router.use(authorize('supplier'));

// @route   POST /api/billing/generate-bill
// @desc    Generate monthly bill for a user
// @access  Private (Supplier only)
router.post('/generate-bill', generateMonthlyBill);

// @route   GET /api/billing/summary
// @desc    Get billing summary for current month
// @access  Private (Supplier only)
router.get('/summary', getBillingSummary);

// @route   GET /api/billing/history/:userId
// @desc    Get bill history for a specific user
// @access  Private (Supplier only)
router.get('/history/:userId', getUserBillHistory);

module.exports = router;
