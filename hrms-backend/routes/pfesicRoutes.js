const express = require('express');
const router = express.Router();
const pfesicController = require('../controllers/pfesicController');
const upload = require('../middlewares/upload');

// Create a new record (with file upload)
router.post('/', upload.single('doc'), pfesicController.createRecord);

// Get all records (optionally filtered by type)
router.get('/', pfesicController.getAllRecords);

// Get a single record
router.get('/:id', pfesicController.getRecord);

// Update a record
// router.put('/:id', pfesicController.updateRecord);
router.put('/:id', upload.single('doc'), pfesicController.updateRecord);

// Delete a record
router.delete('/:id', pfesicController.deleteRecord);

// Download document
router.get('/:id/download', pfesicController.downloadDocument);

module.exports = router;