const express = require('express');
const Leave = require('../models/Leave');
const router = express.Router();

// Helper: Strip time from Date for accurate date-only comparison
// Helper: Strip time from Date for accurate date-only comparison
const stripTime = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};



// POST: Apply for Leave - Only one entry per person per day allowed
router.post('/', async (req, res) => {
  try {
    const { name, leaveType, startDate, endDate } = req.body;

    if (!name || !leaveType || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Normalize start and end dates
    const start = stripTime(startDate);
    const end = endDate ? stripTime(endDate) : start;

    // Check for overlapping leaves
    const existingLeave = await Leave.findOne({
      name,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
        {
          startDate: { $gte: start, $lte: end },
        },
        {
          endDate: { $gte: start, $lte: end },
        }
      ]
    });

    if (existingLeave) {
      return res.status(409).json({
        success: false,
        message: 'Leave already applied by this user for the selected date range',
      });
    }

    // Count existing non-LWP leaves for the year
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear(), 11, 31);

    const leaveCount = await Leave.countDocuments({
      name,
      leaveType: { $in: ['Casual Leave', 'Paid Leave', 'Sick Leave'] },
      startDate: { $gte: yearStart, $lte: yearEnd },
    });

    let adjustedLeaveType = leaveType;
    if (['Casual Leave', 'Paid Leave', 'Sick Leave'].includes(leaveType) && leaveCount >= 12) {
      adjustedLeaveType = 'Unpaid Leave';
    }

    const leave = new Leave({
      ...req.body,
      startDate: start,
      endDate: end,
      leaveType: adjustedLeaveType,
    });

    await leave.save();

    res.status(201).json({
      success: true,
      message: `Leave submitted${adjustedLeaveType !== leaveType ? ' as Unpaid Leave due to quota limit' : ''}`,
      leave,
    });
  } catch (error) {
    console.error('Leave application error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});



// GET: Fetch all leaves
router.get('/', async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: 1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// PUT: Update a leave by ID
router.put('/:id', async (req, res) => {
  try {
    const updated = await Leave.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Leave not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leave' });
  }
});

// DELETE: Delete a leave by ID
router.delete('/:id', async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Leave deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave' });
  }
});

// GET: Count of leaves booked this year
router.get("/booked/count", async (req, res) => {
  try {
    const yearStart = new Date("2025-01-01");
    const yearEnd = new Date("2025-12-31");

    const count = await Leave.countDocuments({
      startDate: { $gte: yearStart, $lte: yearEnd },
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching booked leaves" });
  }
});

// GET: Count leaves this month
router.get("/monthly/count", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const leaves = await Leave.find({
      $or: [
        { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
      ],
    });

    res.json({ count: leaves.length });
  } catch (error) {
    console.error("Error fetching current month leave count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
