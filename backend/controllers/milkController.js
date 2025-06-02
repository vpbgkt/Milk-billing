const MilkEntry = require('../models/MilkEntry');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');

// @desc    Add new milk entry
// @route   POST /api/milk/add-entry
// @access  Private
exports.addEntry = async (req, res) => {
  try {
    const { date, quantity, fat, snf, supplierId } = req.body;

    // Validate required fields
    if (!date || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Date and quantity are required'
      });
    }

    // Check if supplier exists
    let supplier = null;
    if (supplierId) {
      supplier = await User.findById(supplierId);
      if (!supplier || supplier.role !== 'supplier') {
        return res.status(400).json({
          success: false,
          message: 'Invalid supplier'
        });
      }
    }

    // Check if entry already exists for this date
    const existingEntry = await MilkEntry.findOne({
      userId: req.user.id,
      date: new Date(date),
      supplierId: supplierId || null
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Entry already exists for this date'
      });
    }

    // Calculate amount if price is available
    let amount = 0;
    let pricePerLiter = 0;
    
    if (supplier && supplier.milkPrice) {
      pricePerLiter = supplier.milkPrice;
      amount = quantity * pricePerLiter;
    }

    const milkEntry = await MilkEntry.create({
      userId: req.user.id,
      supplierId: supplierId || null,
      date: new Date(date),
      quantity: parseFloat(quantity),
      fat: fat ? parseFloat(fat) : undefined,
      snf: snf ? parseFloat(snf) : undefined,
      pricePerLiter,
      amount,
      status: supplierId ? 'pending' : 'confirmed' // Auto-confirm if no supplier
    });    await milkEntry.populate('supplierId', 'name businessName');

    // Send notification to supplier if entry is pending
    if (supplierId) {
      try {
        const formattedDate = new Date(date).toLocaleDateString('en-IN');
        await NotificationService.sendNotification({
          userId: supplierId,
          type: 'milk_delivery',
          title: 'New Milk Entry Pending 📝',
          message: `${req.user.name} added a milk entry for ${quantity}L on ${formattedDate}. Please review and confirm.`,
          priority: 'medium',
          actionUrl: '/supplier/entries',
          metadata: { 
            entryId: milkEntry._id,
            action: 'pending_review',
            quantity: quantity,
            date: date,
            userName: req.user.name,
            userId: req.user.id
          }
        });
      } catch (notificationError) {
        console.error('Failed to send entry notification to supplier:', notificationError);
        // Don't fail the entry creation if notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: milkEntry,
      message: 'Milk entry added successfully'
    });
  } catch (error) {
    console.error('Add entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Request milk entry (by user to supplier)
// @route   POST /api/milk/request-entry
// @access  Private
exports.requestEntry = async (req, res) => {
  try {
    const { date, quantity, fat, snf, supplierId, note } = req.body;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID is required for entry requests'
      });
    }

    // Check if supplier exists and user is connected
    const supplier = await User.findById(supplierId);
    if (!supplier || supplier.role !== 'supplier') {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier'
      });
    }

    // Check if user is connected to this supplier
    const user = await User.findById(req.user.id);
    if (user.supplierId && user.supplierId.toString() !== supplierId) {
      return res.status(403).json({
        success: false,
        message: 'You are not connected to this supplier'
      });
    }

    const milkEntry = await MilkEntry.create({
      userId: req.user.id,
      supplierId,
      date: new Date(date),
      quantity: parseFloat(quantity),
      fat: fat ? parseFloat(fat) : undefined,
      snf: snf ? parseFloat(snf) : undefined,
      note,
      status: 'pending',
      requestedBy: 'user'
    });    await milkEntry.populate('supplierId', 'name businessName');

    // Send notification to supplier about the entry request
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-IN');
      await NotificationService.sendNotification({
        userId: supplierId,
        type: 'milk_delivery',
        title: 'Milk Entry Request 📋',
        message: `${req.user.name} requested a milk entry for ${quantity}L on ${formattedDate}. Please review and confirm.`,
        priority: 'high',
        actionUrl: '/supplier/entries',
        metadata: { 
          entryId: milkEntry._id,
          action: 'entry_request',
          quantity: quantity,
          date: date,
          userName: req.user.name,
          userId: req.user.id,
          note: note
        }
      });
    } catch (notificationError) {
      console.error('Failed to send entry request notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: milkEntry,
      message: 'Entry request sent to supplier'
    });
  } catch (error) {
    console.error('Request entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get monthly milk data
// @route   GET /api/milk/monthly-data/:year/:month
// @access  Private
exports.getMonthlyData = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);

    const entries = await MilkEntry.find({
      userId: req.user.id,
      date: {
        $gte: startDate,
        $lt: endDate
      }
    })
    .populate('supplierId', 'name businessName')
    .sort({ date: 1 });

    // Calculate monthly summary
    const summary = {
      totalQuantity: 0,
      totalAmount: 0,
      averageFat: 0,
      averageSnf: 0,
      daysRecorded: entries.length,
      confirmedEntries: 0,
      pendingEntries: 0
    };

    let fatSum = 0;
    let snfSum = 0;
    let fatCount = 0;
    let snfCount = 0;

    entries.forEach(entry => {
      summary.totalQuantity += entry.quantity;
      summary.totalAmount += entry.amount;
      
      if (entry.fat) {
        fatSum += entry.fat;
        fatCount++;
      }
      
      if (entry.snf) {
        snfSum += entry.snf;
        snfCount++;
      }

      if (entry.status === 'confirmed') {
        summary.confirmedEntries++;
      } else if (entry.status === 'pending') {
        summary.pendingEntries++;
      }
    });

    summary.averageFat = fatCount > 0 ? (fatSum / fatCount).toFixed(2) : 0;
    summary.averageSnf = snfCount > 0 ? (snfSum / snfCount).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: entries,
      summary,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get daily milk entry
// @route   GET /api/milk/daily-entry/:date
// @access  Private
exports.getDailyEntry = async (req, res) => {
  try {
    const { date } = req.params;
    const entryDate = new Date(date);
    
    // Find entry for the specific date
    const entry = await MilkEntry.findOne({
      userId: req.user.id,
      date: {
        $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(entryDate.setHours(23, 59, 59, 999))
      }
    }).populate('supplierId', 'name businessName');

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'No entry found for this date'
      });
    }

    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get daily entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update milk entry
// @route   PUT /api/milk/entry/:id
// @access  Private
exports.updateEntry = async (req, res) => {
  try {
    let entry = await MilkEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Check if user owns this entry
    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this entry'
      });
    }

    // Don't allow updates to confirmed entries unless user is supplier
    if (entry.status === 'confirmed' && req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update confirmed entries'
      });
    }

    const { quantity, fat, snf, note } = req.body;

    // Update only allowed fields
    if (quantity !== undefined) entry.quantity = parseFloat(quantity);
    if (fat !== undefined) entry.fat = parseFloat(fat);
    if (snf !== undefined) entry.snf = parseFloat(snf);
    if (note !== undefined) entry.note = note;

    // Recalculate amount if quantity changed and price exists
    if (quantity !== undefined && entry.pricePerLiter > 0) {
      entry.amount = entry.quantity * entry.pricePerLiter;
    }

    entry.updatedAt = new Date();
    await entry.save();

    await entry.populate('supplierId', 'name businessName');

    res.status(200).json({
      success: true,
      data: entry,
      message: 'Entry updated successfully'
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete milk entry
// @route   DELETE /api/milk/entry/:id
// @access  Private
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await MilkEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Check if user owns this entry
    if (entry.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this entry'
      });
    }

    // Don't allow deletion of confirmed entries unless user is supplier
    if (entry.status === 'confirmed' && req.user.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete confirmed entries'
      });
    }

    await MilkEntry.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending entries for user
// @route   GET /api/milk/pending-entries
// @access  Private
exports.getPendingEntries = async (req, res) => {
  try {
    const entries = await MilkEntry.find({
      userId: req.user.id,
      status: 'pending'
    })
    .populate('supplierId', 'name businessName')
    .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get pending entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
