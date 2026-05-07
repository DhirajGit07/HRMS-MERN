const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Leave type name is required'],
    trim: true,
    minlength: [1, 'Leave type name cannot be empty'],
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  companyId: {
    type: String,
    // required: [true, 'Company ID is required'],
    trim: true,
  },
}, {
  timestamps: true,
});

leaveTypeSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('LeaveTypeAddEdit', leaveTypeSchema);