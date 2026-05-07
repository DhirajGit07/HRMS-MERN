const LeaveType = require('../models/LeaveType');

// Get all leave types
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({ isArchived: false });
    res.status(200).json(leaveTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave types', error: error.message });
  }
};

// Get archived leave types
exports.getArchivedLeaveTypes = async (req, res) => {
  try {
    const archivedLeaveTypes = await LeaveType.find({ isArchived: true });
    res.status(200).json(archivedLeaveTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching archived leave types', error: error.message });
  }
};

// Get leave types for add/edit dropdown
exports.getLeaveTypesForAddEdit = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({}).select('name');
    res.status(200).json(leaveTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave types for add/edit', error: error.message });
  }
};

// Create new leave type
exports.createLeaveType = async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required' });
    }
    const leaveType = new LeaveType(req.body);
    await leaveType.save();
    res.status(201).json(leaveType);
  } catch (error) {
    res.status(400).json({ message: 'Error creating leave type', error: error.message });
  }
};

// Bulk create leave types
exports.bulkCreateLeaveTypes = async (req, res) => {
  try {
    const { leaveTypes } = req.body;
    if (!Array.isArray(leaveTypes) || leaveTypes.length === 0) {
      return res.status(400).json({ message: 'leaveTypes must be a non-empty array' });
    }
    for (const leaveTypeData of leaveTypes) {
      if (!leaveTypeData.companyId) {
        return res.status(400).json({ message: 'companyId is required for all leave types' });
      }
      if (!leaveTypeData.name) {
        return res.status(400).json({ message: 'name is required for all leave types' });
      }
    }
    const createdLeaveTypes = await Promise.all(
      leaveTypes.map(async (leaveTypeData) => {
        const leaveType = new LeaveType(leaveTypeData);
        return await leaveType.save();
      })
    );
    res.status(201).json({ message: `Created ${createdLeaveTypes.length} leave type(s) successfully`, leaveTypes: createdLeaveTypes });
  } catch (error) {
    res.status(400).json({ message: 'Error creating leave types', error: error.message });
  }
};

// Update leave type
exports.updateLeaveType = async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required' });
    }
    const leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    res.status(200).json(leaveType);
  } catch (error) {
    res.status(400).json({ message: 'Error updating leave type', error: error.message });
  }
};

// Archive leave type
exports.archiveLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    res.status(200).json({ message: 'Leave type archived successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error archiving leave type', error: error.message });
  }
};

// Restore leave type
exports.restoreLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    res.status(200).json({ message: 'Leave type restored successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error restoring leave type', error: error.message });
  }
};

// Delete leave type permanently
exports.deleteLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    res.status(200).json({ message: 'Leave type deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting leave type', error: error.message });
  }
};