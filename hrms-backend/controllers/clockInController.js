const ClockIn = require('../models/ClockIn');

exports.clockIn = async (req, res) => {
  try {
    const { 
      userId, 
      companyId, 
      location, 
      workingFrom, 
      profileInfo 
    } = req.body;

    // Validate input
    if (!userId || !companyId || !location || !workingFrom || !profileInfo) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new clock-in record
    const newClockIn = new ClockIn({
      userId,
      companyId,
      companyName: location,
      location,
      workingFrom,
      profileInfo: {
        firstName: profileInfo.firstName,
        lastName: profileInfo.lastName,
        designation: profileInfo.designation,
        email: profileInfo.email,
        employeeId: profileInfo.employeeId, // Added employeeId to profileInfo
        profileImage: profileInfo.profileImage || '' 
      }
    });

    await newClockIn.save();
    res.status(201).json({
      message: 'Clock-in successful',
      clockIn: newClockIn
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch current session (for compatibility with frontend)
exports.getCurrentSession = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const clockIn = await ClockIn.findOne({
      userId,
      clockOutTime: null
    }).sort({ clockInTime: -1 });

    if (!clockIn) {
      return res.status(404).json({ message: 'No active session found' });
    }

    // Map clockInTime to clockIn for frontend compatibility
    const response = {
      ...clockIn._doc,
      clockIn: clockIn.clockInTime
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClockIns = async (req, res) => {
  try {
    const clockIns = await ClockIn.find({}).sort({ clockInTime: -1 });

    // Map clockInTime to clockIn for frontend compatibility
    const response = clockIns.map(clockIn => ({
      ...clockIn._doc,
      clockIn: clockIn.clockInTime
    }));

    res.status(200).json({
      message: 'All clock-in records retrieved successfully',
      clockIns: response
    });
  } catch (error) {
    console.error('Error fetching clock-in records:', error);
    res.status(500).json({ message: 'Server error' });
  }
};