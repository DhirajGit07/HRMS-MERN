// Backend: attendance.controller.js

const Attendance = require('../models/Attendance');
const AttendanceSetting = require('../models/AttendanceSetting');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Helper to normalize dates to start of day
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to parse time string to Date object for comparison
const parseTimeToDate = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return null;

  // Handle both "HH:MM" and "HH:MM AM/PM" formats
  const timePart = timeStr.split(' ')[0];
  const modifier = timeStr.split(' ')[1]?.toUpperCase();
  
  const parts = timePart.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  let seconds = parts[2] ? parseInt(parts[2], 10) : 0;  // Handle optional seconds
  
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  const date = new Date(baseDate);
  date.setHours(hours, minutes, seconds, 0);
  return date;
};

// Helper to check if clock-in is late
const checkLateClockIn = (checkInTime, shiftStartTime, halfDayMarkTime, lateMarkAfter) => {
  if (!checkInTime || !shiftStartTime || !halfDayMarkTime || !lateMarkAfter) return false;

  const shiftStart = parseTimeToDate(shiftStartTime);
  const halfDayMark = parseTimeToDate(halfDayMarkTime);
  const lateThreshold = new Date(shiftStart);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + lateMarkAfter);

  const checkIn = parseTimeToDate(checkInTime);

  return checkIn > lateThreshold && checkIn <= halfDayMark;
};

// Validate time format (HH:mm or HH:mm:ss)
const validateTimeFormat = (timeStr) => {
  if (!timeStr) return false;
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeStr);  // Allow optional :ss
};

// Validate time sequence with auto-clockout support
const validateTimeSequence = (checkInTime, checkOutTime, isAutoClockOut = false) => {
  if (!checkInTime || !checkOutTime) return false;

  const inParts = checkInTime.split(':');
  const outParts = checkOutTime.split(':');

  const inH = parseInt(inParts[0], 10);
  const inM = parseInt(inParts[1], 10);
  const inS = inParts[2] ? parseInt(inParts[2], 10) : 0;

  const outH = parseInt(outParts[0], 10);
  const outM = parseInt(outParts[1], 10);
  const outS = outParts[2] ? parseInt(outParts[2], 10) : 0;

  const inTotal = inH * 3600 + inM * 60 + inS;
  const outTotal = outH * 3600 + outM * 60 + outS;

  // Allow same time for auto clock-out
  if (isAutoClockOut && inTotal === outTotal) return true;

  return outTotal > inTotal;
};

// Evaluate attendance status
const evaluateAttendanceStatus = (checkInTime, checkOutTime, shiftStartTime, shiftEndTime, halfDayMarkTime, secondHalfMarkTime, isFirstSession = false, lateMarkAfter = 30) => {
  if (!checkInTime || !checkOutTime || !shiftStartTime || !shiftEndTime || !halfDayMarkTime || !secondHalfMarkTime) {
    return {
      status: "",
      isLate: false,
      checkIn: "--:--",
      checkOut: "--:--"
    };
  }

  // Use the same base date for all time comparisons to avoid date mismatches
  const baseDate = new Date();
  const shiftStart = parseTimeToDate(shiftStartTime, baseDate);
  const shiftEnd = parseTimeToDate(shiftEndTime, baseDate);
  const halfDayMark = parseTimeToDate(halfDayMarkTime, baseDate);
  const secondHalfMark = parseTimeToDate(secondHalfMarkTime, baseDate);
  const inTime = parseTimeToDate(checkInTime, baseDate);
  const outTime = parseTimeToDate(checkOutTime, baseDate);

  // Validate parsed times
  if (!inTime || !outTime || isNaN(inTime.getTime()) || isNaN(outTime.getTime())) {
    return {
      status: "",
      isLate: false,
      checkIn: "--:--",
      checkOut: "--:--"
    };
  }

  // Format times to 12-hour format
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const checkInFormatted = formatTime(inTime);
  const checkOutFormatted = formatTime(outTime);

  // Check for late clock-in
  const isLate = isFirstSession && checkLateClockIn(checkInTime, shiftStartTime, halfDayMarkTime, lateMarkAfter);

  // Complete shift: check-in after shift start and before half-day mark, check-out after shift end
  if (inTime >= shiftStart && inTime <= halfDayMark && outTime >= shiftEnd) {
    return {
      status: "present",
      isLate,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted
    };
  }

  // First half: check-out at or before half-day mark
  if (outTime <= halfDayMark) {
    return {
      status: "firstHalf",
      isLate,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted
    };
  }

  // Second half: check-in at or after half-day mark and check-out after second half mark
  if (inTime >= halfDayMark && outTime >= secondHalfMark) {
    return {
      status: "secondHalf",
      isLate: false,
      checkIn: checkInFormatted,
      checkOut: checkOutFormatted
    };
  }

  // Default to secondHalf if none of the above conditions match
  return {
    status: "secondHalf",
    isLate: false,
    checkIn: checkInFormatted,
    checkOut: checkOutFormatted
  };
};

// @desc    Add or update attendance entry
// @route   POST /api/attendance
// @access  Private
const addAttendance = asyncHandler(async (req, res) => {
  const { date, checkIn, checkOut, attendanceType: clientAttendanceType, autoClockOutMinutes } = req.body;
  const userId = req.user._id;

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const attendanceDate = normalizeDate(date);
  const today = normalizeDate(new Date());

  if (attendanceDate > today) {
    return res.status(400).json({ message: 'Cannot create attendance for future dates' });
  }

  // Fetch user-specific attendance settings
  const settings = await AttendanceSetting.findOne({
    assignedEmployees: userId
  });
  if (!settings) {
    return res.status(400).json({ message: 'Attendance settings not configured for this user' });
  }

  const {
    shiftStartTime,
    lateMarkAfter,
    shiftEndTime,
    halfDayMarkTime,
    secondHalfMarkTime,
    maxCheckIn,
    autoClockoutTime
  } = settings;

  // Check if current time is within shift time + autoClockoutTime
  const now = new Date();
  const shiftEndDateTime = parseTimeToDate(shiftEndTime, attendanceDate);
  const effectiveAutoClockOutMinutes = autoClockOutMinutes || autoClockoutTime || 30; // Default to 30 minutes
  const autoClockOutTime = new Date(shiftEndDateTime.getTime() + (effectiveAutoClockOutMinutes * 60 * 1000));

  // Prevent clock-in if too close to auto clock-out
  if (checkIn && !checkOut && now > shiftEndDateTime) {
    const timeUntilAutoClockOut = (autoClockOutTime - now) / (1000 * 60);
    if (timeUntilAutoClockOut < 5) {
      return res.status(400).json({ message: 'Cannot clock in less than 5 minutes before auto clock-out' });
    }
  }

  let attendance = await Attendance.findOne({ user: userId, date: attendanceDate });
  if (!attendance) {
    attendance = new Attendance({ user: userId, date: attendanceDate, sessions: [] });
  }

  const closedCount = attendance.sessions.filter(s => s.checkOut?.time).length;
  let isFirstSession = attendance.sessions.length === 0;
  let lateMessage = false;

  if (checkIn && isFirstSession) {
    lateMessage = checkLateClockIn(checkIn.time, shiftStartTime, halfDayMarkTime, lateMarkAfter);
  }

  // Clock In Only
  if (checkIn && !checkOut) {
    if (closedCount >= maxCheckIn) {
      return res.status(400).json({ message: `Maximum of ${maxCheckIn} clock-ins per day allowed` });
    }

    const hasOpenSession = attendance.sessions.some(s => !s.checkOut?.time);
    if (hasOpenSession) {
      return res.status(400).json({ message: 'You already have an open session. Please clock out first.' });
    }

    if (!validateTimeFormat(checkIn.time)) {
      return res.status(400).json({ message: 'Invalid check-in time format (HH:mm or HH:mm:ss required)' });
    }

    const session = {
      checkIn: { 
        time: checkIn.time, 
        note: checkIn.note || '', 
        lateMark: lateMessage
      },
      checkOut: {},
      attendanceType: "present" // Default, will be updated on clock-out
    };

    // Add auto clock-out details based on shiftEndTime + autoClockoutTime
    if (effectiveAutoClockOutMinutes && Number.isInteger(effectiveAutoClockOutMinutes) && effectiveAutoClockOutMinutes > 0) {
      const scheduledTime = new Date(Math.max(now.getTime(), shiftEndDateTime.getTime()) + effectiveAutoClockOutMinutes * 60 * 1000);
      session.autoClockOut = {
        enabled: true,
        durationMinutes: effectiveAutoClockOutMinutes,
        scheduledTime: scheduledTime
      };
      console.log(`Scheduled auto clock-out for user ${userId} at ${scheduledTime} with duration ${effectiveAutoClockOutMinutes} minutes`);
    }

    attendance.sessions.push(session);
  }
  // Clock Out Only
  else if (checkOut && !checkIn) {
    if (attendance.sessions.length === 0) {
      return res.status(400).json({ message: 'No active session to check out from' });
    }

    const lastSession = attendance.sessions[attendance.sessions.length - 1];
    if (lastSession.checkOut?.time) {
      return res.status(400).json({ message: 'This session is already checked out' });
    }

    const isAutoClockOut = checkOut.note === "Auto clock-out";

    if (!validateTimeFormat(checkOut.time)) {
      return res.status(400).json({ message: 'Invalid check-out time format (HH:mm or HH:mm:ss required)' });
    }

    if (!validateTimeSequence(lastSession.checkIn.time, checkOut.time, isAutoClockOut)) {
      return res.status(400).json({ message: 'Check-out time must be after check-in time' });
    }

    // Determine if first session for capping and status
    isFirstSession = closedCount === 0;

    // Cap check-out time if after effective end time
    const baseDate = new Date(attendance.date);
    const outTimeDate = parseTimeToDate(checkOut.time, baseDate);
    const effectiveEndStr = isFirstSession ? shiftEndTime : secondHalfMarkTime;
    const effectiveEnd = parseTimeToDate(effectiveEndStr, baseDate);
    let cappedOutStr = checkOut.time;
    if (outTimeDate > effectiveEnd) {
      const hours = effectiveEnd.getHours().toString().padStart(2, '0');
      const minutes = effectiveEnd.getMinutes().toString().padStart(2, '0');
      const seconds = '00';  // Set seconds to 00 for capping
      cappedOutStr = `${hours}:${minutes}:${seconds}`;
    }

    const statusResult = evaluateAttendanceStatus(
      lastSession.checkIn.time,
      cappedOutStr,
      shiftStartTime,
      shiftEndTime,
      halfDayMarkTime,
      secondHalfMarkTime,
      isFirstSession,
      lateMarkAfter
    );

    lastSession.checkOut = { 
      time: cappedOutStr, 
      note: checkOut.note || ''
    };
    lastSession.attendanceType = statusResult.status;
    lastSession.autoClockOut = lastSession.autoClockOut || {};
    lastSession.autoClockOut.enabled = false; // Disable auto clock-out since it's now manually closed
  }
  // Full Session
  else if (checkIn && checkOut) {
    if (closedCount >= maxCheckIn) {
      return res.status(400).json({ message: `Maximum of ${maxCheckIn} clock-ins per day allowed` });
    }

    if (!validateTimeFormat(checkIn.time) || !validateTimeFormat(checkOut.time)) {
      return res.status(400).json({ message: 'Invalid time format (HH:mm or HH:mm:ss required)' });
    }

    if (!validateTimeSequence(checkIn.time, checkOut.time)) {
      return res.status(400).json({ message: 'Check-out time must be after check-in time' });
    }

    // Cap check-out time if after effective end time
    const baseDate = new Date(attendance.date);
    const outTimeDate = parseTimeToDate(checkOut.time, baseDate);
    const effectiveEndStr = isFirstSession ? shiftEndTime : secondHalfMarkTime;
    const effectiveEnd = parseTimeToDate(effectiveEndStr, baseDate);
    let cappedOutStr = checkOut.time;
    if (outTimeDate > effectiveEnd) {
      const hours = effectiveEnd.getHours().toString().padStart(2, '0');
      const minutes = effectiveEnd.getMinutes().toString().padStart(2, '0');
      const seconds = '00';  // Set seconds to 00 for capping
      cappedOutStr = `${hours}:${minutes}:${seconds}`;
    }

    const statusResult = evaluateAttendanceStatus(
      checkIn.time,
      cappedOutStr,
      shiftStartTime,
      shiftEndTime,
      halfDayMarkTime,
      secondHalfMarkTime,
      isFirstSession,
      lateMarkAfter
    );

    attendance.sessions.push({
      checkIn: { 
        time: checkIn.time, 
        note: checkIn.note || '', 
        lateMark: lateMessage
      },
      checkOut: { 
        time: cappedOutStr, 
        note: checkOut.note || ''
      },
      attendanceType: statusResult.status
    });
  }
  else {
    return res.status(400).json({ message: 'Either checkIn or checkOut data must be provided' });
  }

  // Calculate total hours for the session
  const lastSession = attendance.sessions[attendance.sessions.length - 1];
  if (lastSession.checkIn.time && lastSession.checkOut.time) {
    const inTime = parseTimeToDate(lastSession.checkIn.time, attendance.date);
    const outTime = parseTimeToDate(lastSession.checkOut.time, attendance.date);
    const hours = (outTime - inTime) / (1000 * 60 * 60);
    attendance.totalHours = (attendance.totalHours || 0) + hours;
  }

  await attendance.save();
  console.log(`Attendance saved for user ${userId} on date ${attendanceDate.toISOString().split('T')[0]}`);
  
  res.status(201).json({
    _id: attendance._id,
    user: attendance.user,
    date: attendance.date,
    sessions: attendance.sessions,
    totalHours: attendance.totalHours
  });
});

// @desc    Get active session for the user
// @route   GET /api/attendance/active
// @access  Private
const getActiveSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = normalizeDate(new Date());

  const attendance = await Attendance.findOne({
    user: userId,
    date: today,
    sessions: { $elemMatch: { 'checkOut.time': { $exists: false } } }
  });

  if (!attendance || !attendance.sessions.length) {
    return res.status(200).json({ activeSession: null });
  }

  const activeSession = attendance.sessions.find(s => !s.checkOut.time);
  if (!activeSession) {
    return res.status(200).json({ activeSession: null });
  }

  // Calculate elapsed time since check-in for timer resumption
  const checkInTime = parseTimeToDate(activeSession.checkIn.time, today);
  const now = new Date();
  const elapsedSeconds = Math.floor((now - checkInTime) / 1000);

  res.status(200).json({
    activeSession: {
      checkIn: activeSession.checkIn,
      date: attendance.date,
      sessionId: attendance.sessions.indexOf(activeSession),
      elapsedSeconds // Send elapsed time to frontend
    }
  });
});

// @desc    Process auto clock-out for pending sessions
// @route   POST /api/attendance/auto-clockout
// @access  Private (System)
const processAutoClockOut = asyncHandler(async (req, res) => {
  const now = new Date();
  console.log(`Running auto clock-out job at ${now.toISOString()}`);
  
  const records = await Attendance.find({
    sessions: {
      $elemMatch: {
        'autoClockOut.enabled': true,
        'autoClockOut.scheduledTime': { $lte: now },
        'checkOut.time': { $exists: false }
      }
    }
  }).populate('user', 'name email');

  console.log(`Found ${records.length} records for auto clock-out`);

  for (const attendance of records) {
    const settings = await AttendanceSetting.findOne({
      assignedEmployees: attendance.user
    });
    if (!settings) {
      console.log(`No settings found for user ${attendance.user._id}`);
      continue;
    }

    const {
      shiftStartTime,
      shiftEndTime,
      halfDayMarkTime,
      secondHalfMarkTime,
      lateMarkAfter
    } = settings;

    let modified = false;

    for (const session of attendance.sessions) {
      if (session.autoClockOut?.enabled && session.autoClockOut.scheduledTime <= now && !session.checkOut.time) {
        const checkInDateTime = parseTimeToDate(session.checkIn.time, attendance.date);
        const timeSinceCheckIn = (now - checkInDateTime) / (1000 * 60);
        if (timeSinceCheckIn < 5) continue;

        const isFirstSession = attendance.sessions.indexOf(session) === 0;
        const effectiveEndStr = isFirstSession ? shiftEndTime : secondHalfMarkTime;
        const effectiveEndDateTime = parseTimeToDate(effectiveEndStr, attendance.date);
        const checkOutTimeStr = `${effectiveEndDateTime.getHours().toString().padStart(2, '0')}:${effectiveEndDateTime.getMinutes().toString().padStart(2, '0')}:00`;  // :00 for seconds

        const statusResult = evaluateAttendanceStatus(
          session.checkIn.time,
          checkOutTimeStr,
          shiftStartTime,
          shiftEndTime,
          halfDayMarkTime,
          secondHalfMarkTime,
          isFirstSession,
          lateMarkAfter
        );

        session.checkOut = {
          time: checkOutTimeStr,
          note: 'Auto clock-out'
        };
        session.attendanceType = statusResult.status;
        session.autoClockOut.enabled = false;
        modified = true;

        console.log(`Auto clock-out processed for user ${attendance.user.email} on ${attendance.date.toISOString().split('T')[0]} at ${checkOutTimeStr}`);
      }
    }

    if (modified) {
      // Update total hours
      const totalMinutes = attendance.sessions.reduce((sum, session) => {
        if (!session.checkIn.time || !session.checkOut.time) return sum;
        const inParts = session.checkIn.time.split(':').map(Number);
        const outParts = session.checkOut.time.split(':').map(Number);
        const inH = inParts[0];
        const inM = inParts[1];
        const inS = inParts[2] || 0;
        const outH = outParts[0];
        const outM = outParts[1];
        const outS = outParts[2] || 0;
        let sessionMinutes = ((outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS)) / 60;
        if (sessionMinutes < 0) sessionMinutes = 0;
        return sum + sessionMinutes;
      }, 0);
      attendance.totalHours = parseFloat((totalMinutes / 60).toFixed(2));

      await attendance.save();
      console.log(`Attendance updated for user ${attendance.user.email} on ${attendance.date.toISOString().split('T')[0]}`);
    }
  }

  res.json({ message: `Auto clock-out processed for ${records.length} records` });
});

// @desc    Get user's attendance list
// @route   GET /api/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user._id;

  if (!start || !end) {
    return res.status(400).json({ message: 'Both start and end dates are required' });
  }

  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  endDate.setHours(23, 59, 59, 999);

  const records = await Attendance.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  res.json(records);
});

// @desc    Get attendance summary for user
// @route   GET /api/attendance/summary
// @access  Private
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user._id;

  if (!start || !end) {
    return res.status(400).json({ message: 'Both start and end dates are required' });
  }

  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  endDate.setHours(23, 59, 59, 999);

  const records = await Attendance.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  let weekendDays = 0, holidayDays = 0, presentDays = 0, totalHours = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      weekendDays++;
      continue;
    }

    const rec = records.find(r => r.date.getTime() === normalizeDate(d).getTime());
    if (rec && rec.sessions.length) {
      presentDays++;
      totalHours += rec.totalHours || 0;
    }
  }

  res.json({ 
    payableDays: totalDays - weekendDays - holidayDays, 
    presentDays, 
    paidLeaveDays: 0, 
    holidayDays, 
    weekendDays, 
    totalDays, 
    totalHours 
  });
});

// @desc    Update attendance entry
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid attendance ID' });
  }

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }

  if (attendance.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    return res.status(401).json({ message: 'Not authorized to update this record' });
  }

  const updated = await Attendance.findByIdAndUpdate(
    id, 
    req.body, 
    { new: true, runValidators: true }
  );
  
  res.json(updated);
});

// @desc    Delete attendance entry
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid attendance ID' });
  }

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }

  if (attendance.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
    return res.status(401).json({ message: 'Not authorized to delete this record' });
  }

  await attendance.remove();
  res.json({ message: 'Attendance record removed' });
});

// @desc    Get all employees' attendance list
// @route   GET /api/attendance/all
// @access  Private (Admin only)
const getAllEmployeeAttendance = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  let filter = {};

  if (start && end) {
    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    endDate.setHours(23, 59, 59, 999);
    filter.date = { $gte: startDate, $lte: endDate };
  }

  const records = await Attendance.find(filter)
    .populate('user', 'name email role')
    .sort({ date: 1 });

  res.json(records);
});

// Background job to process auto clock-outs
const scheduleAutoClockOutJob = () => {
  console.log('Starting auto clock-out background job');
  setInterval(async () => {
    try {
      console.log(`Auto clock-out job triggered at ${new Date().toISOString()}`);
      await processAutoClockOut({ body: {} }, { json: () => {} });
    } catch (error) {
      console.error('Error in auto clock-out job:', error);
    }
  }, 60 * 1000); // Run every minute
};

// Start the auto clock-out job when the server starts
scheduleAutoClockOutJob();

module.exports = {
  addAttendance,
  getAttendance,
  getAttendanceSummary,
  updateAttendance,
  deleteAttendance,
  getAllEmployeeAttendance,
  processAutoClockOut,
  getActiveSession
};