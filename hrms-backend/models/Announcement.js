const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  companyId: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;