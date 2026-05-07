const mongoose = require('mongoose');

const onlyAlphabets = [/^[a-zA-Z\s]+$/, 'Only letters and spaces are allowed'];

const fileSchema = new mongoose.Schema({
   employeeId: {
    type: String,
    
  },
  employeeName: {
    type: String,
   
   
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    match: onlyAlphabets,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    match: [/^[a-zA-Z\s]*$/, 'Only letters and spaces are allowed in description'],
  },
  sharedWith: {
    type: String,
    required: [true, 'Shared With is required'],
    trim: true,
  },
  folder: {
    type: String,
    required: [true, 'Folder is required'],
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  isPolicy: {
    type: Boolean,
    default: false,
  },
  noDeadline: {
    type: Boolean,
    default: false,
  },
  enforceDeadline: {
    type: Boolean,
    default: false,
  },
  ackDeadline: {
    type: Date,
  },
  downloadAccess: {
    type: Boolean,
    default: true,
  },
  notifyFeed: {
    type: Boolean,
    default: true,
  },
  notifyEmail: {
    type: Boolean,
    default: false,
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', fileSchema);
