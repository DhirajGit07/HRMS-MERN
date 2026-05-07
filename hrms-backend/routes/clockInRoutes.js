const express = require('express');
const router = express.Router();
const clockInController = require('../controllers/clockInController');

// Clock-in endpoint
router.post('/', clockInController.clockIn);

// Get current session
router.get('/current-session', clockInController.getCurrentSession);

// Get all clock-in records for a user
router.get('/', clockInController.getClockIns);

module.exports = router;