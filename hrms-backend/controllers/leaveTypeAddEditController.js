const LeaveType = require('../models/leaveTypeAddEditModel');

const initialValues = [
  'Sick Leave',
  'Casual Leave',
  'Paid Leave',
  'Unpaid Leave',
  'Paternity Leave',
  'Sabbatical Leave',
];

// Capitalize the first letter of each word
const capitalizeWords = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Initialize leave types if collection is empty
const initializeLeaveTypes = async () => {
  try {
    const count = await LeaveType.countDocuments();
    if (count === 0) {
      console.log('No leave types found, initializing with default values...');
      const leaveTypes = initialValues.map((name, index) => ({
        name: capitalizeWords(name),
        order: index,
      }));
      await LeaveType.insertMany(leaveTypes);
      console.log('Initial leave types inserted successfully');
    }
  } catch (error) {
    console.error('Error initializing leave types:', error);
  }
};

// Get all leave types, sorted by order
exports.getLeaveTypes = async (req, res) => {
  try {
    await initializeLeaveTypes(); // Initialize if empty
    const leaveTypes = await LeaveType.find().sort({ order: 1 });
    res.status(200).json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Create a new leave type
exports.createLeaveType = async (req, res) => {
  try {
    console.log('Create leave type request body:', req.body); // Debug log
    const { name, companyId } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid leave type name is required' });
    }
    const capitalizedName = capitalizeWords(name);
    const count = await LeaveType.countDocuments();
    const leaveTypeData = { name: capitalizedName, order: count };
    if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
      leaveTypeData.companyId = companyId;
    }
    const leaveType = new LeaveType(leaveTypeData);
    await leaveType.save();
    res.status(201).json(leaveType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Leave type name already exists for this company' });
    }
    console.error('Error creating leave type:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Update a leave type
exports.updateLeaveType = async (req, res) => {
  try {
    console.log('Update leave type request body:', req.body); // Debug log
    const { id } = req.params;
    const { name, companyId } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid leave type name is required' });
    }
    const capitalizedName = capitalizeWords(name);
    const updateData = { name: capitalizedName };
    if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
      updateData.companyId = companyId;
    }
    const leaveType = await LeaveType.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    res.status(200).json(leaveType);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Leave type name already exists for this company' });
    }
    console.error('Error updating leave type:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Delete a leave type
exports.deleteLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByIdAndDelete(id);
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    await LeaveType.updateMany(
      { order: { $gt: leaveType.order } },
      { $inc: { order: -1 } }
    );
    res.status(200).json({ message: 'Leave type deleted' });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Reorder leave types
exports.reorderLeaveTypes = async (req, res) => {
  try {
    const { id, newOrder } = req.body;
    const leaveType = await LeaveType.findById(id);
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    const oldOrder = leaveType.order;
    if (oldOrder === newOrder) {
      return res.status(200).json({ message: 'No change in order' });
    }
    leaveType.order = newOrder;
    await leaveType.save();
    if (newOrder < oldOrder) {
      await LeaveType.updateMany(
        { order: { $gte: newOrder, $lt: oldOrder }, _id: { $ne: id } },
        { $inc: { order: 1 } }
      );
    } else {
      await LeaveType.updateMany(
        { order: { $gt: oldOrder, $lte: newOrder }, _id: { $ne: id } },
        { $inc: { order: -1 } }
      );
    }
    res.status(200).json({ message: 'Order updated' });
  } catch (error) {
    console.error('Error reordering leave types:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};