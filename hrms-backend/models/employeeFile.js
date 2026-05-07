

const mongoose = require('mongoose');

const employeeFileSchema = new mongoose.Schema({
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
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
  },
  sharedWithType: {
    type: String,
    enum: ['employee', 'multiple', 'role'],
    default: 'employee'
  },
  sharedWith: {
    type: [String], // Array of employee IDs
    required: true
  },
  folder: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  isPolicy: {
    type: Boolean,
    default: false
  },
  noDeadline: {
    type: Boolean,
    default: false
  },
  enforceDeadline: {
    type: Boolean,
    default: false
  },
  ackDeadline: {
    type: Date,
    default: null
  },
  downloadAccess: {
    type: Boolean,
    default: true
  },
  notifyFeed: {
    type: Boolean,
    default: true
  },
  notifyEmail: {
    type: Boolean,
    default: false
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  permissions: {
    view: {
      employee: { type: Boolean, default: false },
      manager: { type: Boolean, default: false }
    },
    download: {
      employee: { type: Boolean, default: false },
      manager: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeFile', employeeFileSchema);