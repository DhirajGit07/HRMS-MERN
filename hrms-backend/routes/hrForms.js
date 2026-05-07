const express = require('express');
const router = express.Router();
const hrFormsController = require('../controllers/hrFormsController');
const upload = require('../middlewares/hrUpload'); // Import the HR upload middleware

// Get all HR forms
router.get('/', hrFormsController.getAllHRForms);

// Upload a new HR form
router.post(
  '/',
  upload.single('file'),
  hrFormsController.uploadHRForm
);

// Download an HR form
router.get('/download/:id', hrFormsController.downloadHRForm);

// Delete an HR form
router.delete('/:id', hrFormsController.deleteHRForm);

module.exports = router;