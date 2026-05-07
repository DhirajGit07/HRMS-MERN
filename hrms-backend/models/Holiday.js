const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  companyId: {
    type: String,
    // required: true
  },
  date: {
    type: Date,
    required: true
  },
  label: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for date to ensure no duplicates and faster queries
holidaySchema.index({ date: 1 }, { unique: true });

const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday;