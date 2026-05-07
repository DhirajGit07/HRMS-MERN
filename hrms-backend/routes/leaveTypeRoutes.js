const express = require('express');
const router = express.Router();
const leaveTypeController = require('../controllers/leaveTypeController');

router.get('/', leaveTypeController.getAllLeaveTypes);
router.get('/archived', leaveTypeController.getArchivedLeaveTypes);
router.get('/leave-types-Add-Edit', leaveTypeController.getLeaveTypesForAddEdit);
router.post('/', leaveTypeController.createLeaveType);
router.post('/bulk', leaveTypeController.bulkCreateLeaveTypes);
router.put('/:id', leaveTypeController.updateLeaveType);
router.put('/archive/:id', leaveTypeController.archiveLeaveType);
router.put('/restore/:id', leaveTypeController.restoreLeaveType);
router.delete('/:id', leaveTypeController.deleteLeaveType);

module.exports = router;