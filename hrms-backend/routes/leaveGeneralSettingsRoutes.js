const express = require('express');
const router = express.Router();
const leaveSettingsController = require('../controllers/leaveGeneralSettingsController');

// Routes for leave settings
router.get('/general-settings', leaveSettingsController.getSettings);
router.post('/general-settings', leaveSettingsController.saveSettings);

module.exports = router;