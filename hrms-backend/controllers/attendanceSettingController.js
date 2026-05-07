// attendanceSettingController.js
const mongoose = require('mongoose');
const AttendanceSetting = require('../models/AttendanceSetting');

// Get all attendance settings
exports.getAllSettings = async (req, res) => {
  try {
    const query = req.query.companyId ? { companyId: req.query.companyId } : {};
    const settings = await AttendanceSetting.find(query)
      .populate('assignedEmployees', 'fullname employeeId')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching attendance settings:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance settings',
      error: err.message
    });
  }
};

// Create new attendance setting
exports.createSetting = async (req, res) => {
  try {
    console.log('Request body:', req.body);

    // Validate required fields
    if (!req.body.shiftName || !req.body.shiftStartTime || !req.body.shiftEndTime || !req.body.companyId || !req.body.autoClockoutTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (shiftName, shiftStartTime, shiftEndTime, companyId, autoClockoutTime)'
      });
    }

    // Check if shift with this name and companyId already exists
    const existingShift = await AttendanceSetting.findOne({
      shiftName: req.body.shiftName,
      companyId: req.body.companyId
    });
    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'Shift with this name already exists for this company'
      });
    }

    const newSetting = new AttendanceSetting({
      shiftName: req.body.shiftName,
      companyId: req.body.companyId,
      assignedEmployees: req.body.assignedEmployees || [],
      shiftStartTime: req.body.shiftStartTime,
      shiftEndTime: req.body.shiftEndTime,
      halfDayMarkTime: req.body.halfDayMarkTime,
      secondHalfMarkTime: req.body.secondHalfMarkTime,
      lateMarkAfter: req.body.lateMarkAfter || 0,
      maxCheckIn: req.body.maxCheckIn || 1,
      autoClockoutTime: req.body.autoClockoutTime || 30,
      workingDays: req.body.workingDays || []
    });

    const savedSetting = await newSetting.save();

    res.status(201).json({
      success: true,
      message: 'Attendance setting created successfully',
      data: savedSetting
    });
  } catch (err) {
    console.error('Error creating attendance setting:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create attendance setting',
      error: err.message
    });
  }
};

// Update attendance setting
exports.updateSetting = async (req, res) => {
  try {
    const setting = await AttendanceSetting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedEmployees', 'fullname employeeId');
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Attendance setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance setting updated successfully',
      data: setting
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance setting',
      error: err.message
    });
  }
};

// Delete attendance setting
exports.deleteSetting = async (req, res) => {
  try {
    const setting = await AttendanceSetting.findByIdAndDelete(req.params.id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Attendance setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Attendance setting deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance setting',
      error: err.message
    });
  }
};

// Get single attendance setting
exports.getSetting = async (req, res) => {
  try {
    const setting = await AttendanceSetting.findById(req.params.id)
      .populate('assignedEmployees', 'fullname employeeId');
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Attendance setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance setting',
      error: err.message
    });
  }
};

// Get employees not assigned to any shift
exports.getUnassignedEmployees = async (req, res) => {
  try {
    const allEmployees = await mongoose.model('UserLogin').find();
    const assignedEmployees = await AttendanceSetting.aggregate([
      { $unwind: '$assignedEmployees' },
      { $group: { _id: null, employees: { $addToSet: '$assignedEmployees' } } }
    ]);
    
    const assignedIds = assignedEmployees.length > 0 
      ? assignedEmployees[0].employees.map(id => id.toString()) 
      : [];
    
    const unassigned = allEmployees.filter(
      emp => !assignedIds.includes(emp._id.toString())
    );
    
    res.status(200).json({
      success: true,
      data: unassigned
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned employees',
      error: err.message
    });
  }
};