const express = require('express');
const router = express.Router();
const attendanceSettingController = require('../controllers/attendanceSettingController');

// Get all settings
router.get('/', attendanceSettingController.getAllSettings);

// Create new setting
router.post('/', attendanceSettingController.createSetting);

// Get single setting
router.get('/:id', attendanceSettingController.getSetting);

// Update setting
router.put('/:id', attendanceSettingController.updateSetting);

// Delete setting
router.delete('/:id', attendanceSettingController.deleteSetting);

module.exports = router;