const express = require('express');
const router = express.Router();

// Import milk controller functions
const {
  addEntry,
  getMonthlyData,
  getDailyEntry,
  updateEntry,
  deleteEntry,
  getPendingEntries,
  requestEntry
} = require('../controllers/milkController');

const { protect, isOwnerOrSupplier } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Milk entry management
router.post('/add-entry', addEntry);
router.post('/request-entry', requestEntry);
router.get('/monthly-data/:year/:month', getMonthlyData);
router.get('/daily-entry/:date', getDailyEntry);
router.put('/entry/:id', updateEntry);
router.delete('/entry/:id', deleteEntry);

// Pending entries
router.get('/pending-entries', getPendingEntries);

module.exports = router;
