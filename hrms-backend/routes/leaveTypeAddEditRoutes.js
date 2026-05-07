const express = require('express');
const router = express.Router();
const leaveTypeAddEditController = require('../controllers/leaveTypeAddEditController');

// Define routes
router.post('/', leaveTypeAddEditController.createLeaveType);
router.get('/', leaveTypeAddEditController.getLeaveTypes);
router.put('/reorder/:id', leaveTypeAddEditController.reorderLeaveTypes);
router.put('/:id', leaveTypeAddEditController.updateLeaveType);
router.delete('/:id', leaveTypeAddEditController.deleteLeaveType);

module.exports = router;