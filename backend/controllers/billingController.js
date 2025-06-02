const MilkEntry = require('../models/MilkEntry');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');
const mongoose = require('mongoose');

// @desc    Generate monthly bill for a user
// @route   POST /api/billing/generate-bill
// @access  Private (Supplier only)
const generateMonthlyBill = async (req, res) => {
  try {
    const { userId, month, year, pricePerLiter } = req.body;

    // Validate inputs
    if (!userId || !month || !year || !pricePerLiter) {
      return res.status(400).json({
        success: false,
        message: 'User ID, month, year, and price per liter are required'
      });
    }

    // Check if user exists and is connected to this supplier
    const user = await User.findById(userId);
    if (!user || user.supplierId?.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not connected to your account'
      });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all milk entries for the user in this month
    const milkEntries = await MilkEntry.find({
      userId: userId,
      supplierId: req.user.id,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'confirmed'
    }).sort({ date: 1 });

    if (milkEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No milk entries found for this month'
      });
    }

    // Calculate bill details
    const billDetails = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      },
      supplier: {
        id: req.user.id,
        name: req.user.name,
        businessName: req.user.businessName
      },
      period: {
        month: month,
        year: year,
        startDate: startDate,
        endDate: endDate
      },
      pricePerLiter: pricePerLiter,
      entries: milkEntries.map(entry => ({
        date: entry.date,
        quantity: entry.quantity,
        fat: entry.fat,
        snf: entry.snf,
        amount: entry.quantity * pricePerLiter
      })),
      summary: {
        totalEntries: milkEntries.length,
        totalQuantity: milkEntries.reduce((sum, entry) => sum + entry.quantity, 0),
        totalAmount: milkEntries.reduce((sum, entry) => sum + (entry.quantity * pricePerLiter), 0),
        averageQuantityPerDay: milkEntries.reduce((sum, entry) => sum + entry.quantity, 0) / milkEntries.length,
        averageFat: milkEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0) / milkEntries.length,
        averageSnf: milkEntries.reduce((sum, entry) => sum + (entry.snf || 0), 0) / milkEntries.length
      },
      generatedAt: new Date(),
      billNumber: `BILL-${req.user.id.slice(-6)}-${year}${month.toString().padStart(2, '0')}-${user._id.toString().slice(-4)}`
    };    // Update milk entries with billing information
    const entriesToUpdate = await MilkEntry.find({
      userId: userId,
      supplierId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    for (let entry of entriesToUpdate) {
      entry.pricePerUnit = pricePerLiter;
      entry.totalAmount = entry.quantity * pricePerLiter;
      entry.billedAt = new Date();
      await entry.save();    }

    // Send billing notification to user
    try {
      const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
      const totalAmount = billDetails.summary.totalAmount;
      const dueDate = new Date(year, month, 10); // Assuming bills are due on the 10th of next month
      
      await NotificationService.sendNotification({
        userId: userId,
        type: 'payment',
        title: 'Monthly Bill Generated 💰',
        message: `Your ${monthName} ${year} milk bill of ₹${totalAmount.toFixed(2)} has been generated. Due date: ${dueDate.toLocaleDateString('en-IN')}.`,
        priority: 'high',
        actionUrl: '/dashboard/billing',
        metadata: { 
          billNumber: billDetails.billNumber,
          amount: totalAmount,
          month: month,
          year: year,
          dueDate: dueDate,
          supplierName: req.user.name,
          totalQuantity: billDetails.summary.totalQuantity
        }
      });
    } catch (notificationError) {
      console.error('Failed to send billing notification:', notificationError);
      // Don't fail bill generation if notification fails
    }

    res.status(200).json({
      success: true,
      data: billDetails,
      message: 'Monthly bill generated successfully'
    });

  } catch (error) {
    console.error('Generate bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating bill'
    });
  }
};

// @desc    Get billing summary for supplier
// @route   GET /api/billing/summary
// @access  Private (Supplier only)
const getBillingSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Default to current month if not provided
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get all connected users
    const connectedUsers = await User.find({
      supplierId: req.user.id,
      isActive: true
    });

    // Get billing summary for each user
    const billingSummary = await Promise.all(
      connectedUsers.map(async (user) => {
        const milkEntries = await MilkEntry.find({
          userId: user._id,
          supplierId: req.user.id,
          date: { $gte: startDate, $lte: endDate },
          status: 'confirmed'
        });

        const totalQuantity = milkEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const totalAmount = milkEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);

        return {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone
          },
          entries: milkEntries.length,
          totalQuantity: totalQuantity,
          totalAmount: totalAmount,
          hasBill: milkEntries.some(entry => entry.billedAt),
          lastEntry: milkEntries.length > 0 ? milkEntries[milkEntries.length - 1].date : null
        };
      })
    );

    // Calculate overall summary
    const overallSummary = {
      period: {
        month: targetMonth,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString('default', { month: 'long' })
      },
      totalUsers: connectedUsers.length,
      usersWithEntries: billingSummary.filter(u => u.entries > 0).length,
      totalEntries: billingSummary.reduce((sum, u) => sum + u.entries, 0),
      totalQuantity: billingSummary.reduce((sum, u) => sum + u.totalQuantity, 0),
      totalRevenue: billingSummary.reduce((sum, u) => sum + u.totalAmount, 0),
      billedUsers: billingSummary.filter(u => u.hasBill).length
    };

    res.status(200).json({
      success: true,
      data: {
        summary: overallSummary,
        users: billingSummary
      }
    });

  } catch (error) {
    console.error('Get billing summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching billing summary'
    });
  }
};

// @desc    Get user's bill history
// @route   GET /api/billing/history/:userId
// @access  Private (Supplier only)
const getUserBillHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 12 } = req.query;

    // Check if user exists and is connected
    const user = await User.findById(userId);
    if (!user || user.supplierId?.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not connected to your account'
      });
    }

    // Aggregate bill history by month
    const billHistory = await MilkEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          supplierId: new mongoose.Types.ObjectId(req.user.id),
          status: 'confirmed',
          billedAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          entryCount: { $sum: 1 },
          averageFat: { $avg: '$fat' },
          averageSnf: { $avg: '$snf' },
          pricePerLiter: { $first: '$pricePerUnit' },
          billedAt: { $first: '$billedAt' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        history: billHistory.map(bill => ({
          period: {
            month: bill._id.month,
            year: bill._id.year,
            monthName: new Date(bill._id.year, bill._id.month - 1, 1).toLocaleString('default', { month: 'long' })
          },
          totalQuantity: bill.totalQuantity,
          totalAmount: bill.totalAmount,
          entryCount: bill.entryCount,
          averageFat: Math.round(bill.averageFat * 100) / 100,
          averageSnf: Math.round(bill.averageSnf * 100) / 100,
          pricePerLiter: bill.pricePerLiter,
          billedAt: bill.billedAt
        }))
      }
    });

  } catch (error) {
    console.error('Get user bill history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bill history'
    });
  }
};

module.exports = {
  generateMonthlyBill,
  getBillingSummary,
  getUserBillHistory
};
