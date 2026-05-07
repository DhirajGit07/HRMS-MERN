// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyId: { type: String, },
  dashboardName: { type: String, default: 'My Space' },
  wallpaper: { type: String, default: '' },
  logo: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

settingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Setting', settingSchema);