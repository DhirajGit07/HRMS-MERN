const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  allotment: {
    type: String,
    enum: ['Monthly', 'Yearly', 'Custom'],
    default: 'Yearly'
  },
  noOfLeaves: {
    type: Number,
    required: true
  },
  monthlyLimit: {
    type: String,
    default: '--'
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partially Paid'],
    default: 'Paid'
  },
  colorCode: {
    type: String,
    default: '#16813D'
  },
  departments: [{
    type: String
  }],
  designations: [{
    type: String
  }],
  gender: [{
    type: String,
    enum: ['Male', 'Female', 'Others']
  }],
  maritalStatus: [{
    type: String,
    enum: ['Single', 'Married', 'Widower', 'Widow', 'Separate', 'Divorced']
  }],
  userRole: [{
    type: String,
  }],
  effectiveAfter: {
    type: Date
  },
  effectiveAfterUnit: {
    type: String,
    enum: ['Day(s)', 'Month(s)', 'Year(s)'],
    default: 'Day(s)'
  },
  allowedInProbation: {
    type: Boolean,
    default: true
  },
  unusedLeaves: {
    type: String,
    enum: ['Carry Forward', 'Lapse', 'Encash'],
    default: 'Carry Forward'
  },
  allowedInNoticePeriod: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LeaveType', leaveTypeSchema);