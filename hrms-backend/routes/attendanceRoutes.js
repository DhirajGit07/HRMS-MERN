const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../controllers/authController');

router.post('/', protect, attendanceController.addAttendance);
router.get('/', protect, attendanceController.getAttendance);
router.get('/summary', protect, attendanceController.getAttendanceSummary);
router.put('/:id', protect, attendanceController.updateAttendance);
router.delete('/:id', protect, attendanceController.deleteAttendance);
router.get('/all', protect, attendanceController.getAllEmployeeAttendance);
router.post('/auto-clockout', attendanceController.processAutoClockOut);
router.get('/active', protect, attendanceController.getActiveSession);

module.exports = router;