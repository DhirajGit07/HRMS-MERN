const mongoose = require('mongoose');

const leaveSettingsSchema = new mongoose.Schema({
  countLeavesFrom: {
    type: String,
    enum: ['joiningDate', 'startOfYear'],
    default: 'joiningDate',
    required: true
  },
  yearStartsFrom: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December'],
    default: null
  },
  managerAction: {
    type: String,
    enum: ['Approve', 'Not-Approve'],
    default: 'Approve',
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('leaveGeneralSettingsModel', leaveSettingsSchema);